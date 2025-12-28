import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'


const SUBSCRIPTION_PRICE_MXN = 20.00

export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia',
    })

    try {
        const session = await auth()
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { businessId } = await request.json()

        // --- PREPARAR CLIENTE STRIPE ---
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

        // Crear Sesión de Suscripción
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomer.id,
            payment_method_types: ['card', 'oxxo'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: 'Membresía Partner CarMatch',
                            description: 'Suscripción Mensual - Publicidad y Mapa',
                        },
                        unit_amount: Math.round(SUBSCRIPTION_PRICE_MXN * 100),
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${request.headers.get('origin')}/profile?subscription=success`,
            cancel_url: `${request.headers.get('origin')}/business/register?canceled=true`,
            metadata: {
                userId: session.user.id,
                businessId: businessId || 'pending',
                type: 'BUSINESS_SUBSCRIPTION_MONTHLY'
            },
        })

        return NextResponse.json({ url: checkoutSession.url })

    } catch (error) {
        console.error('Error creating subscription session:', error)
        return NextResponse.json({ error: 'Error al iniciar suscripción' }, { status: 500 })
    }
}
