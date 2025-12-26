import webpush from 'web-push'

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
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('Error sending push notification:', error)
        return false
    }
}
