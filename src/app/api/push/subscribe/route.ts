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

        // Guardar suscripción
        await prisma.pushSubscription.create({
            data: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Push Subscription Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
