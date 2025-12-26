import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const { status } = await request.json()

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json(appointment)
    } catch (error) {
        console.error('Error updating appointment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
