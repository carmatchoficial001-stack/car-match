import { processChatMessage } from '@/lib/chat-ai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

        // 🤖 IA: Analizar intención de reunión (Fire & Forget)
        processChatMessage(chatId, content, user.id).catch(err => console.error('Error en Chat AI:', err))

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

        // Obtener mensajes
        const messages = await prisma.message.findMany({
            where: { chatId },
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
            ...appointments.map(a => ({ ...a, type: 'APPOINTMENT', content: 'Cita Propuesta', senderId: a.proposerId }))
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        // 🤖 IA ANALISTA: Alertas Proactivas de Citas
        const upcomingAppointment = appointments.find(a =>
            a.status === 'ACCEPTED' &&
            new Date(a.date!) > new Date() &&
            new Date(a.date!).getTime() - new Date().getTime() < 1000 * 60 * 60 * 2 // Próximas 2 horas
        )

        if (upcomingAppointment) {
            timeline.push({
                id: 'ai-alert-upcoming',
                chatId,
                senderId: 'SYSTEM_AI',
                content: `🚨 RECORDATORIO ANALISTA: Tu cita para ver el vehículo está próxima (${new Date(upcomingAppointment.date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Recuerda llegar con 10 min de anticipación y en un lugar público.`,
                createdAt: new Date().toISOString(),
                type: 'MESSAGE',
                isRead: true,
                sender: {
                    id: 'SYSTEM_AI',
                    name: 'Analista CarMatch 🤖',
                    image: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
                }
            } as any)
        }

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
