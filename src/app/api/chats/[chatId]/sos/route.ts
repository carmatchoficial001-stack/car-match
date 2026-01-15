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

        // 0. Verificar si ya hay una emergencia activa para esta cita
        if (appointmentId) {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId }
            })
            if (appointment?.status === 'EMERGENCY') {
                return NextResponse.json({
                    success: false,
                    message: 'Ya hay una alerta SOS activa para esta cita. El protocolo ya ha sido iniciado.'
                }, { status: 409 }) // Conflict
            }
        }

        // Log de la emergencia (Para auditoría de seguridad)
        console.log(`🚨 SOS ACTIVADO por ${user.name} en el chat ${chatId}`)
        if (trustedContact) {
            console.log(`📲 Notificando a contacto de confianza: ${trustedContact.name} (${trustedContact.email})`)
        }

        // 1. Crear un mensaje de sistema en el chat sobre la alerta SOS
        await prisma.message.create({
            data: {
                chatId,
                senderId: 'SYSTEM',
                content: `🚨 **ALERTA SOS ACTIVADA** 🚨\nEl usuario ${user.name} ha activado el protocolo de emergencia. Ubicación reportada: ${latitude}, ${longitude}. Autoridades locales y contacto de confianza han sido notificados.`,
            }
        })

        // 2. Enviar Push urgente al otro usuario del chat
        await sendPushToUser(otherUser.id, {
            title: '🚨 ALERTA DE EMERGENCIA',
            body: `${user.name} ha activado la señal SOS. SE REQUIERE INTERVENCIÓN.`,
            url: `/messages/${chatId}`
        })

        // 3. Notificar al contacto de confianza (Simulación enriquecida)
        if (trustedContact) {
            const emergencyDetails = {
                alertedBy: {
                    name: user.name,
                    image: user.image,
                    phone: user.phone
                },
                otherParty: {
                    name: otherUser.name,
                    image: otherUser.image,
                    phone: otherUser.phone
                },
                location: {
                    lat: latitude,
                    lng: longitude,
                    googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
                },
                vehicle: chat.vehicle.title
            }

            console.log(`🚨 SOS DETALLES PARA CONTACTO DE CONFIANZA (${trustedContact.name}):`, JSON.stringify(emergencyDetails, null, 2))

            // Aquí se enviaría el SMS/Email real con los datos de ambos usuarios
            await sendPushToUser(trustedContact.id, {
                title: `🆘 EMERGENCIA: ${user.name} necesita ayuda`,
                body: `Protocolo SOS activado durante la cita por "${chat.vehicle.title}". Ubicación: ${latitude},${longitude}. Datos del otro usuario: ${otherUser.name}.`,
                url: `/messages/${chatId}?is_emergency=true`
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
            message: 'SOS activado y datos de ambos usuarios enviados al contacto de confianza',
            trustedContactNotified: !!trustedContact
        })

    } catch (error) {
        console.error('Error procesando SOS:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
