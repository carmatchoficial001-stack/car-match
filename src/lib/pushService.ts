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
    tag?: string
    renotify?: boolean
    requireInteraction?: boolean
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
        console.log(`[PUSH] Buscando suscripciones para usuario: ${userId}`)

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        })

        console.log(`[PUSH] Encontradas ${subscriptions.length} suscripciones`)

        if (subscriptions.length === 0) {
            console.log(`[PUSH] ⚠️ Usuario ${userId} no tiene dispositivos suscritos a notificaciones push`)
            return false
        }

        const promises = subscriptions.map(async (sub, index) => {
            console.log(`[PUSH] Enviando notificación a dispositivo ${index + 1}/${subscriptions.length}`)
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }
            const result = await sendPushNotification(pushConfig, payload)
            console.log(`[PUSH] Resultado dispositivo ${index + 1}: ${result ? '✓ enviado' : '✗ falló'}`)
            return result
        })

        await Promise.all(promises)
        console.log(`[PUSH] ✓ Proceso completado para usuario ${userId}`)
        return true
    } catch (error) {
        console.error('[PUSH] ✗ Error in sendPushToUser:', error)
        return false
    }
}
