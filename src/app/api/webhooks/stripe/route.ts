// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'


const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia',
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
        // Caso 1: Checkout Session con pago inmediato (Tarjeta)
        // Para SPEI/OXXO este evento llega con payment_status='unpaid'.
        // En ese caso NO sumamos créditos; esperamos checkout.session.async_payment_succeeded.
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const metadata = session.metadata

            if (session.payment_status === 'paid' && metadata?.type === 'CREDIT_PURCHASE') {
                const userId = metadata.userId
                const creditsToAdd = parseInt(metadata.credits || '0')
                const paymentIntentId = session.payment_intent as string

                if (userId && creditsToAdd > 0 && paymentIntentId) {
                    await processCreditPurchase(userId, creditsToAdd, paymentIntentId, session.amount_total! / 100, session.currency!, 'Compra de créditos (Tarjeta)')
                }
            } else if (metadata?.type === 'BUSINESS_SUBSCRIPTION_MONTHLY') {
                console.log(`🏢 Suscripción completada para negocio: ${metadata.businessId}`)
            }
        }

        // Caso 2: 🔥 CRÍTICO — Pago asíncrono confirmado (SPEI / OXXO / Transferencia bancaria)
        // Stripe dispara este evento DÍAS DESPUÉS cuando el banco confirma la transferencia.
        // Sin este handler, los usuarios de SPEI/OXXO NUNCA reciben sus créditos.
        if (event.type === 'checkout.session.async_payment_succeeded') {
            const session = event.data.object as Stripe.Checkout.Session
            const metadata = session.metadata

            await prisma.systemLog.create({
                data: {
                    level: 'INFO',
                    source: 'StripeWebhook',
                    message: `💸 Pago async confirmado (SPEI/OXXO): session ${session.id}`,
                    metadata: { sessionId: session.id, userId: metadata?.userId }
                }
            })

            if (metadata?.type === 'CREDIT_PURCHASE') {
                const userId = metadata.userId
                const creditsToAdd = parseInt(metadata.credits || '0')
                const paymentIntentId = session.payment_intent as string

                if (userId && creditsToAdd > 0 && paymentIntentId) {
                    await processCreditPurchase(userId, creditsToAdd, paymentIntentId, session.amount_total! / 100, session.currency!, 'Compra de créditos (SPEI/OXXO)')
                }
            }
        }

        // Caso 3: Payment Intent Directo (Fallback)
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const metadata = paymentIntent.metadata
            const userId = metadata?.userId
            const creditsToAdd = parseInt(metadata?.credits || '0')
            const isCreditPurchase = metadata?.type === 'CREDIT_PURCHASE'

            if (userId && creditsToAdd > 0 && isCreditPurchase) {
                await processCreditPurchase(userId, creditsToAdd, paymentIntent.id, paymentIntent.amount / 100, paymentIntent.currency, 'Compra de créditos (PaymentIntent directo)')
            }
        }

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

// Función auxiliar para no repetir código
async function processCreditPurchase(userId: string, credits: number, transactionId: string, amount: number, currency: string, description: string = 'Compra de créditos') {
    // Verificar si ya se procesó
    const existing = await prisma.payment.findUnique({
        where: { transactionId: transactionId }
    })

    if (existing) return;

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                userId: userId,
                amount: amount,
                currency: currency.toUpperCase(),
                transactionId: transactionId,
                status: 'COMPLETED',
                creditsAdded: credits
            }
        }),
        prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: credits }
            }
        }),
        prisma.creditTransaction.create({
            data: {
                userId: userId,
                amount: credits,
                description: description,
                relatedId: transactionId,
                details: {
                    gateway: 'stripe',
                    amount: amount,
                    currency: currency
                }
            }
        })
    ])

    await prisma.systemLog.create({
        data: {
            level: 'INFO',
            source: 'PaymentService',
            message: `✅ ${credits} créditos sumados al usuario ${userId}`,
            metadata: { transactionId, credits, userId }
        }
    })

    console.log(`✅ ${credits} créditos sumados al usuario ${userId}`)
}
