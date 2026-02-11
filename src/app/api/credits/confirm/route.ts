// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'


export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-12-18.acacia' as any,
    })


    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { paymentIntentId, sessionId } = await request.json()

        let piId = ''
        let creditsToAdd = 0
        let userId = ''
        let amount = 0
        let currency = 'mxn'
        let stripeType = ''

        // 1. Obtención Quirúrgica de Datos (Una sola ráfaga)
        if (sessionId) {
            const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
            if (checkoutSession.payment_status !== 'paid') {
                return NextResponse.json({ error: 'El pago aún no ha sido confirmado por el banco o Stripe.' }, { status: 400 })
            }
            piId = checkoutSession.payment_intent as string
            creditsToAdd = parseInt(checkoutSession.metadata?.credits || '0')
            userId = checkoutSession.metadata?.userId || ''
            amount = checkoutSession.amount_total! / 100
            currency = checkoutSession.currency!
            stripeType = checkoutSession.metadata?.type || ''
        } else if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            if (paymentIntent.status !== 'succeeded') {
                return NextResponse.json({ error: 'El pago no se ha completado.' }, { status: 400 })
            }
            piId = paymentIntent.id
            creditsToAdd = parseInt(paymentIntent.metadata?.credits || '0')
            userId = paymentIntent.metadata?.userId || ''
            amount = paymentIntent.amount / 100
            currency = paymentIntent.currency
            stripeType = paymentIntent.metadata?.type || ''
        } else {
            return NextResponse.json({ error: 'Falta identificador de pago' }, { status: 400 })
        }

        // 2. Blindaje de Validación (Eagle Eye Check)
        if (!piId) return NextResponse.json({ error: 'No se encontró la intención de pago' }, { status: 404 })
        if (creditsToAdd <= 0) return NextResponse.json({ error: 'No hay créditos válidos en este pago' }, { status: 400 })
        if (stripeType !== 'CREDIT_PURCHASE') {
            return NextResponse.json({ error: 'Este pago no corresponde a una compra de créditos de CarMatch' }, { status: 400 })
        }

        // 2. Verificar que el pago sea para el usuario actual
        if (userId !== session.user.id) {
            return NextResponse.json({ error: 'El pago no corresponde al usuario actual' }, { status: 403 })
        }

        // 3. Verificar si ya se procesó (Webhook o intento previo)
        const existingPayment = await prisma.payment.findUnique({
            where: { transactionId: piId }
        })

        if (existingPayment) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } })
            return NextResponse.json({
                success: true,
                message: 'Pago ya procesado',
                creditsAdded: existingPayment.creditsAdded,
                currentCredits: user?.credits
            })
        }

        // 4. Transacción Quirúrgica: Registrar pago, Sumar créditos y Crear Movimiento
        const [updatedUser] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: creditsToAdd } }
            }),
            prisma.payment.create({
                data: {
                    userId: userId,
                    amount: amount,
                    currency: currency.toUpperCase(),
                    transactionId: piId,
                    status: 'COMPLETED',
                    creditsAdded: creditsToAdd,
                    paymentMethod: 'stripe'
                }
            }),
            prisma.creditTransaction.create({
                data: {
                    userId: userId,
                    amount: creditsToAdd,
                    description: 'Compra de créditos (Sincronización manual)',
                    relatedId: piId,
                    details: { gateway: 'stripe', amount, currency }
                }
            })
        ])

        return NextResponse.json({
            success: true,
            creditsAdded: creditsToAdd,
            currentCredits: updatedUser.credits
        })

    } catch (error) {
        console.error('Error confirmando pago:', error)
        return NextResponse.json({ error: 'Error interno al confirmar créditos' }, { status: 500 })
    }
}
