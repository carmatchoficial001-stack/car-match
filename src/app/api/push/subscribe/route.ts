// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const subscription = await req.json()
        console.log('[API] Push Subscription Request:', {
            userId: session.user.id,
            endpoint: subscription.endpoint ? 'Present' : 'Missing'
        })

        // 🛡️ Evitar duplicados: Buscar si ya existe la suscripción para este endpoint
        const existingSub = await prisma.pushSubscription.findFirst({
            where: {
                userId: session.user.id,
                endpoint: subscription.endpoint
            }
        })

        if (!existingSub) {
            // Guardar suscripción solo si no existe
            await prisma.pushSubscription.create({
                data: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            })
            console.log('[API] New Push Subscription saved')
        } else {
            console.log('[API] Push Subscription already exists, skipping')
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Push Subscription Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
