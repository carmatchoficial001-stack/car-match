import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/pushService'

// POST /api/chats/[chatId]/messages - Enviar un mensaje
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { chatId } = await params
        const body = await request.json()
        const { content } = body

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
        }

        // Verificar que el chat existe y el usuario es parte de él
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: { vehicle: true }
        })

        if (!chat) {
            return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
        }

        if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
            return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
        }

        // Verificar que el vehículo sigue activo
        if (chat.vehicle.status !== 'ACTIVE') {
            return NextResponse.json({
                error: 'Este vehículo ya no está disponible. Posiblemente se vendió.',
                vehicleStatus: chat.vehicle.status
            }, { status: 410 }) // 410 Gone
        }

        // Crear el mensaje
        const message = await prisma.message.create({
            data: {
                chatId,
                senderId: user.id,
                content: content.trim()
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Actualizar el timestamp del chat
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        })

        // TODO: Crear notificación para el otro usuario
        const receiverId = chat.buyerId === user.id ? chat.sellerId : chat.buyerId
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'NEW_MESSAGE',
                title: 'Nuevo mensaje',
                message: `${user.name} te envió un mensaje sobre ${chat.vehicle.title}`,
                link: `/messages/${chatId}`,
                metadata: {
                    chatId,
                    senderId: user.id,
                    vehicleId: chat.vehicleId
                }
            }
        })

        // 2. Enviar notificación Push (Sistema)
        await sendPushToUser(receiverId, {
            title: `Mensaje de ${user.name}`,
            body: content.length > 50 ? content.substring(0, 47) + '...' : content,
            url: `/messages/${chatId}`,
            icon: user.image || undefined,
            tag: `message-${message.id}`
        })

        // 🚀 3. EMITIR EVENTO SOCKET.IO (Real-time)
        try {
            const io = (global as any).io
            if (io) {
                // Emitir mensaje al room del chat
                io.to(`chat:${chatId}`).emit('new-message', message)

                // Emitir notificación visual al usuario que recibe
                io.to(`user:${receiverId}`).emit('message-update')

                console.log(`✅ [SOCKET] Emitted new-message to chat:${chatId}`)
            } else {
                console.warn('⚠️ [SOCKET] Server IO not found (Global var missing)')
            }
        } catch (error) {
            console.error('❌ [SOCKET] Error emitting event:', error)
            // No fallar el request por error de socket explicitamente
        }

        return NextResponse.json(message)

    } catch (error) {
        console.error('Error al enviar mensaje:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

// GET /api/chats/[chatId]/messages - Obtener mensajes de un chat
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { chatId } = await params
        console.log(`🔍 [API GET] Request for Chat: ${chatId} by User: ${user.id}`)
        console.log(`[DEBUG API] GET /api/chats/${chatId}/messages. Session user: ${user.id}`)

        // Verificar que el chat existe y el usuario es parte de él
        const chat = await prisma.chat.findUnique({
            where: { id: chatId }
        })

        if (!chat) {
            return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
        }

        if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
            return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
        }

        const messages = await prisma.message.findMany({
            where: {
                chatId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Obtener citas (Appointments)
        const appointments = await prisma.appointment.findMany({
            where: { chatId }
        })

        // Combinar y ordenar cronológicamente
        let timeline = [
            ...messages.map(m => ({ ...m, type: 'MESSAGE' })),
            ...appointments.map(a => ({
                ...a,
                type: 'APPOINTMENT',
                senderId: a.proposerId,
                sender: messages.find(m => m.senderId === a.proposerId)?.sender || { id: a.proposerId, name: 'Usuario', image: null }
            }))
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        console.log(`[API GET Messages] Chat: ${chatId}, Found: ${messages.length} msgs, ${appointments.length} apps. Total: ${timeline.length}`)

        // Marcar mensajes como leídos
        await prisma.message.updateMany({
            where: {
                chatId,
                senderId: { not: user.id },
                isRead: false
            },
            data: { isRead: true }
        })

        return NextResponse.json(timeline)

    } catch (error) {
        console.error('Error al obtener mensajes:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
