import webpush from 'web-push'
import { prisma } from './db'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@carmatch.app',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

interface PushPayload {
    title: string
    body: string
    url?: string
    icon?: string
}

export async function sendPushNotification(subscription: any, payload: PushPayload) {
    try {
        // Asegurar que el icono sea una URL absoluta si es relativa
        const baseUrl = process.env.NEXTAUTH_URL || 'https://carmatchapp.net'
        if (payload.icon && !payload.icon.startsWith('http')) {
            payload.icon = `${baseUrl}${payload.icon.startsWith('/') ? '' : '/'}${payload.icon}`
        }

        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return true
    } catch (error) {
        // If subscription is expired or invalid, we should ideally remove it
        if (error instanceof Error && (error as any).statusCode === 410) {
            console.log('Push subscription expired, should be removed')
        }
        console.error('Error sending push notification:', error)
        return false
    }
}

/**
 * Envía una notificación push a todos los dispositivos suscritos de un usuario específico
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        })

        if (subscriptions.length === 0) return false

        const promises = subscriptions.map(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }
            return sendPushNotification(pushConfig, payload)
        })

        await Promise.all(promises)
        return true
    } catch (error) {
        console.error('Error in sendPushToUser:', error)
        return false
    }
}
