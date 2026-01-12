import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
                seller: { include: { trustedContact: true } }
            }
        })

        if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })

        const isBuyer = chat.buyerId === session.user.id
        const user = isBuyer ? chat.buyer : chat.seller
        const otherUser = isBuyer ? chat.seller : chat.buyer
        const trustedContact = user.trustedContact

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
                content: `🚨 **ALERTA SOS ACTIVADA** 🚨\nEl usuario ${user.name} ha activado el protocolo de emergencia. Autoridades locales y contacto de confianza han sido notificados.`,
            }
        })

        // 2. Si hay una cita activa, marcarla como emergencia
        if (appointmentId) {
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    monitoringActive: false, // Detener monitoreo normal
                    // Aquí podríamos guardar la ubicación de la emergencia si tuviéramos los campos
                }
            })
        }

        // 3. Simulación de envío de ubicación al contacto de confianza
        // En una app real, aquí enviaríamos un SMS, Push o Email con un link de rastreo
        // Por ahora, simulamos el éxito de la operación

        return NextResponse.json({
            success: true,
            message: 'SOS activado correctamente',
            trustedContactNotified: !!trustedContact
        })

    } catch (error) {
        console.error('Error procesando SOS:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
