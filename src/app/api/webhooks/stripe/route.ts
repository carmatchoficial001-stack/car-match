// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const STRIPE_API_VERSION = '2025-02-24.acacia' as const
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: STRIPE_API_VERSION,
    })

    if (!WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    let event: Stripe.Event

    try {
        if (!sig) throw new Error('No signature')
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    // --- LOG DE DIAGNÓSTICO ---
    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            source: 'StripeWebhook',
            message: `Evento recibido: ${event.type}`,
            metadata: { eventId: event.id, type: event.type }
        }
    })

    // --- MANEJAR EVENTOS ---
    try {
        // ✅ CASO 1: Pago con Tarjeta (Inmediato)
        // Para SPEI/OXXO este evento llega con payment_status='unpaid' → lo ignoramos aquí.
        // Los pagos async se manejan en checkout.session.async_payment_succeeded.
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const metadata = session.metadata

            if (session.payment_status === 'paid' && metadata?.type === 'CREDIT_PURCHASE') {
                const userId = metadata.userId
                const creditsToAdd = parseInt(metadata.credits || '0')
                // 🔑 Clave única: usar `session.id` como fallback cuando payment_intent es null
                // (ocurre con customer_balance/SPEI si se completan de forma inmediata)
                const transactionId = (session.payment_intent as string) || session.id

                if (userId && creditsToAdd > 0 && transactionId) {
                    await processCreditPurchase(
                        userId, creditsToAdd, transactionId,
                        session.amount_total! / 100, session.currency!,
                        'Compra de créditos (Tarjeta)'
                    )
                }
            } else if (metadata?.type === 'BUSINESS_SUBSCRIPTION_MONTHLY') {
                console.log(`🏢 Suscripción completada para negocio: ${metadata.businessId}`)
            }
        }

        // ✅ CASO 2: Pago Async Confirmado (SPEI / OXXO)
        // 🔥 CRÍTICO — Este evento se dispara DÍAS DESPUÉS cuando el banco confirma.
        // Sin este handler, los usuarios de SPEI/OXXO NUNCA reciben sus créditos.
        if (event.type === 'checkout.session.async_payment_succeeded') {
            const session = event.data.object as Stripe.Checkout.Session
            const metadata = session.metadata

            await prisma.systemLog.create({
                data: {
                    level: 'INFO',
                    source: 'StripeWebhook',
                    message: `💸 Pago async confirmado (SPEI/OXXO): session ${session.id}`,
                    metadata: { sessionId: session.id, userId: metadata?.userId, paymentIntent: session.payment_intent }
                }
            })

            if (metadata?.type === 'CREDIT_PURCHASE') {
                const userId = metadata.userId
                const creditsToAdd = parseInt(metadata.credits || '0')
                // 🔑 FIX CRÍTICO SPEI: Para customer_balance (SPEI), session.payment_intent es NULL.
                // Usamos session.id como transactionId único para evitar que se pierdan los créditos.
                const transactionId = (session.payment_intent as string) || `spei_${session.id}`

                if (userId && creditsToAdd > 0) {
                    await processCreditPurchase(
                        userId, creditsToAdd, transactionId,
                        session.amount_total! / 100, session.currency!,
                        'Compra de créditos (SPEI/OXXO)'
                    )
                }
            }
        }

        // ✅ CASO 3: Fallo async (SPEI vence sin pago) — Log de diagnóstico
        if (event.type === 'checkout.session.async_payment_failed') {
            const session = event.data.object as Stripe.Checkout.Session
            await prisma.systemLog.create({
                data: {
                    level: 'WARN',
                    source: 'StripeWebhook',
                    message: `⚠️ Pago async FALLÓ: session ${session.id}`,
                    metadata: { sessionId: session.id, userId: session.metadata?.userId }
                }
            })
        }

        // ❌ ELIMINADO: payment_intent.succeeded — causaba RIESGO DE DOBLE CRÉDITO.
        // checkout.session.completed ya maneja tarjeta.
        // checkout.session.async_payment_succeeded ya maneja SPEI/OXXO.

    } catch (error) {
        console.error('Error procesando el evento de webhook:', error)
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                source: 'StripeWebhook',
                message: error instanceof Error ? error.message : 'Unknown error',
                metadata: { event: event.id, type: event.type }
            }
        })
        return NextResponse.json({ error: 'Process error' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}

// Función auxiliar reutilizable (idempotente por transactionId)
async function processCreditPurchase(
    userId: string, credits: number, transactionId: string,
    amount: number, currency: string, description: string = 'Compra de créditos'
) {
    // 🛡️ Idempotencia: Si ya se procesó, salir silenciosamente
    const existing = await prisma.payment.findUnique({
        where: { transactionId }
    })
    if (existing) {
        console.log(`[StripeWebhook] Pago ${transactionId} ya procesado. Saliendo.`)
        return;
    }

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                userId,
                amount,
                currency: currency.toUpperCase(),
                transactionId,
                status: 'COMPLETED',
                creditsAdded: credits
            }
        }),
        prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: credits } }
        }),
        prisma.creditTransaction.create({
            data: {
                userId,
                amount: credits,
                description,
                relatedId: transactionId,
                details: { gateway: 'stripe', amount, currency }
            }
        })
    ])

    await prisma.systemLog.create({
        data: {
            level: 'SUCCESS',
            source: 'PaymentService',
            message: `✅ ${credits} créditos sumados al usuario ${userId}`,
            metadata: { transactionId, credits, userId }
        }
    })

    console.log(`✅ ${credits} créditos sumados al usuario ${userId} via ${transactionId}`)
}
