import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'


export async function POST(request: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia',
    })


    try {
        const session = await auth()
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { quantity, country = 'MX' } = await request.json()

        if (!quantity || quantity < 1) {
            return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
        }

        // █▓▒░ PROHIBIDO MODIFICAR ESTOS PRECIOS SIN CONSULTA PREVIA ░▒▓█
        // ----------------------------------------------------------------
        // Esta lógica define tus ingresos reales (20/40 MXN). 
        // Si se cambia sin precaución, el modelo de negocio puede colapsar.
        const BASE_PRICE_MXN = 20.00
        const PREMIUM_PRICE_MXN = 40.00
        // ----------------------------------------------------------------

        const emergingMarkets = [
            'CO', 'AR', 'PE', 'CL', 'EC', 'GT', 'CR', 'BR', 'MX',
            'IN', 'CN', 'VN', 'TH', 'ID', 'PH', 'EG', 'NG'
        ]

        const priceMxn = emergingMarkets.includes(country) ? BASE_PRICE_MXN : PREMIUM_PRICE_MXN
        const unitPriceInCents = Math.round(priceMxn * 100)
        const currency = 'mxn'

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

        // Lógica de Métodos de Pago Inteligente
        const checkoutParams: any = {
            customer: stripeCustomer.id,
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            // █▓▒░ CONFIGURACIÓN CRÍTICA DE PRECIOS (20/40 MXN) ░▒▓█
                            // Cambiar esto afecta directamente el cobro automático en Stripe.
                            // La lógica de precios se define en las constantes BASE_PRICE_MXN y PREMIUM_PRICE_MXN.
                            // Asegúrate de que cualquier cambio aquí refleje la estrategia de precios global.
                            name: `Paquete de Créditos (${quantity})`,
                            description: `Créditos para publicar vehículos en CarMatch`,
                            images: ['https://carmatch.mx/logo.png'],
                        },
                        unit_amount: unitPriceInCents,
                    },
                    quantity: quantity,
                },
            ],
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/credits?canceled=true`,
            payment_intent_data: {
                metadata: {
                    userId: session.user.id,
                    credits: quantity.toString(),
                    type: 'CREDIT_PURCHASE'
                },
            },
            metadata: {
                userId: session.user.id,
                credits: quantity.toString(),
                type: 'CREDIT_PURCHASE'
            },
        }

        // Si es México, forzamos OXXO y SPEI para que no "desaparezcan"
        if (country === 'MX') {
            checkoutParams.payment_method_types = ['card', 'oxxo', 'customer_balance']
            checkoutParams.payment_method_options = {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'mx_bank_transfer',
                    },
                },
            }
        } else {
            // Para el resto del mundo (China, etc.), Stripe activará Alipay, WeChat, etc. automáticamente
            checkoutParams.automatic_payment_methods = { enabled: true }
        }

        // Crear sesión de Checkout
        const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

        return NextResponse.json({ url: checkoutSession.url })

    } catch (error: any) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json({ error: error.message || 'Error al iniciar pago' }, { status: 500 })
    }
}
