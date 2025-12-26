import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Inicializar Stripe con la clave secreta (desde .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia' as any,
})

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/MXN'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { country, quantity } = await request.json()

        // --- LÓGICA DE PRECIOS ---
        const BASE_PRICE_MXN = 20.00
        const PREMIUM_PRICE_MXN = 40.00

        const emergingMarkets = [
            'CO', 'AR', 'PE', 'CL', 'EC', 'GT', 'CR', 'BR', 'MX',
            'IN', 'CN', 'VN', 'TH', 'ID', 'PH', 'EG', 'NG'
        ]

        let amountInCents = 0
        let currency = 'mxn'

        if (country === 'MX') {
            const totalMxn = BASE_PRICE_MXN * quantity
            amountInCents = Math.round(totalMxn * 100)
            currency = 'mxn'
        } else {
            let usdToMxnRate = 16.50
            try {
                const response = await fetch(EXCHANGE_API, { next: { revalidate: 3600 } })
                if (response.ok) {
                    const data = await response.json()
                    usdToMxnRate = 1 / data.rates.USD
                }
            } catch (e) {
                console.warn('Error fetching rate', e)
            }

            let priceMxn = emergingMarkets.includes(country) ? BASE_PRICE_MXN : PREMIUM_PRICE_MXN
            let priceUsd = priceMxn / usdToMxnRate
            if (priceUsd < 0.50) priceUsd = 0.50

            const totalUsd = priceUsd * quantity
            amountInCents = Math.round(totalUsd * 100)
            currency = 'usd'
        }

        // --- PREPARAR CLIENTE STRIPE (Requerido para SPEI) ---
        let stripeCustomer;
        const customers = await stripe.customers.list({
            email: session.user.email,
            limit: 1
        });

        if (customers.data.length > 0) {
            stripeCustomer = customers.data[0];
        } else {
            stripeCustomer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || 'Cliente CarMatch',
                metadata: { userId: session.user.id }
            });
        }

        // Crear PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            customer: stripeCustomer.id,
            amount: amountInCents,
            currency: currency,
            payment_method_types: ['card', 'oxxo', 'customer_balance'],
            payment_method_options: {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'mx_bank_transfer',
                    },
                },
            },
            metadata: {
                userId: session.user.id,
                credits: quantity.toString(),
                country: country,
                type: 'CREDIT_PURCHASE'
            }
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret
        })

    } catch (error) {
        console.error('Error creating payment intent:', error)
        return NextResponse.json({ error: 'Error al iniciar pago' }, { status: 500 })
    }
}
