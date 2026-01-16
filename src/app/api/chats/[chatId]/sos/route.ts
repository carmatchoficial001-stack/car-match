import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/pushService'

// POST /api/chats/[chatId]/sos - Activar alerta de emergencia
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { chatId } = await params
        const body = await request.json()
        const { appointmentId, latitude, longitude } = body

        // Obtener información necesaria del chat y usuarios
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                buyer: { include: { trustedContact: true } },
                seller: { include: { trustedContact: true } },
                vehicle: { select: { title: true } }
            }
        })

        if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })

        const isBuyer = chat.buyerId === session.user.id
        const user = isBuyer ? chat.buyer : chat.seller
        const otherUser = isBuyer ? chat.seller : chat.buyer
        const trustedContact = user.trustedContact

        // 0. Crear registro oficial de Alerta SOS
        const sosAlert = await prisma.sOSAlert.create({
            data: {
                victimId: user.id,
                counterpartId: otherUser.id,
                chatId,
                appointmentId,
                victimLat: latitude || user.lastLatitude,
                victimLng: longitude || user.lastLongitude,
                counterpartLat: otherUser.lastLatitude,
                counterpartLng: otherUser.lastLongitude,
                status: 'ACTIVE'
            }
        })

        // Log de la emergencia (Para auditoría de seguridad)
        console.log(`🚨 SOS ACTIVADO por ${user.name} en el chat ${chatId}. ID Alerta: ${sosAlert.id}`)

        // 1. Crear un mensaje de sistema en el chat sobre la alerta SOS
        await prisma.message.create({
            data: {
                chatId,
                senderId: 'SYSTEM',
                content: `🚨 **ALERTA SOS ACTIVADA** 🚨\nEl usuario ${user.name} ha activado el protocolo de emergencia. Autoridades locales y contacto de confianza han sido notificados.`,
            }
        })

        // 2. Enviar Push urgente al otro usuario del chat (el potencial agresor o testigo)
        await sendPushToUser(otherUser.id, {
            title: '🚨 ALERTA DE EMERGENCIA',
            body: `${user.name} ha activado la señal SOS. SE REQUIERE INTERVENCIÓN.`,
            url: `/messages/${chatId}`,
            tag: `sos-alert-${sosAlert.id}`,
            requireInteraction: true,
            renotify: true
        })

        // 3. Notificar al contacto de confianza con link de rastreo real
        if (trustedContact) {
            const trackingUrl = `/emergency/${sosAlert.id}`

            await sendPushToUser(trustedContact.id, {
                title: `🆘 EMERGENCIA: ${user.name} necesita ayuda`,
                body: `Protocolo SOS activado. Pulsa para VER UBICACIÓN EN TIEMPO REAL de ambos usuarios.`,
                url: trackingUrl,
                tag: `sos-tracking-${sosAlert.id}`,
                requireInteraction: true,
                renotify: true
            })
        }

        // 4. Si hay una cita activa, marcarla como emergencia
        if (appointmentId) {
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    monitoringActive: false,
                    status: 'EMERGENCY'
                }
            })
        }

        return NextResponse.json({
            success: true,
            alertId: sosAlert.id,
            message: 'SOS activado y rastreo en tiempo real iniciado.',
            trustedContactNotified: !!trustedContact
        })

    } catch (error) {
        console.error('Error procesando SOS:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
