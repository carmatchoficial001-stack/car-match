import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/pushService'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const data = await request.json()
        const { chatId, date, location, address, latitude, longitude } = data

        const appointment = await prisma.appointment.create({
            data: {
                chatId,
                proposerId: session.user.id,
                date: new Date(date),
                location,
                address,
                latitude,
                longitude,
                status: 'PENDING'
            }
        })

        // Notificar en el chat (mensaje de sistema opcional o dejar que la UI lo maneje)
        // Por ahora solo creamos la cita

        // 2. Notificar al otro usuario vía Push
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: { buyerId: true, sellerId: true }
        })

        if (chat) {
            const receiverId = chat.buyerId === session.user.id ? chat.sellerId : chat.buyerId
            await sendPushToUser(receiverId, {
                title: '📅 Nueva cita propuesta',
                body: `${session.user.name} ha propuesto una reunión en ${location}`,
                url: `/messages/${chatId}`
            })
        }

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error creating appointment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
