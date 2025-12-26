import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

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

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error creating appointment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
