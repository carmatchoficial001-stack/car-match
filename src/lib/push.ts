// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import webpush from 'web-push'

// Configurar VAPID con variables de entorno
// (En producción, asegurar que estén seteadas)
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''

if (publicKey && privateKey) {
    webpush.setVapidDetails(
        'mailto:support@carmatch.com',
        publicKey,
        privateKey
    )
}

export async function sendPushNotification(subscription: any, payload: { title: string, body: string, url?: string, icon?: string }) {
    if (!publicKey || !privateKey) {
        console.warn('VAPID keys not configured')
        return
    }

    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('Error sending push:', error)
        return false
    }
}
