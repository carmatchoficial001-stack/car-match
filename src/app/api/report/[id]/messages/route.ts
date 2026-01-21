import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Obtener mensajes de un reporte
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id } = await context.params

        const messages = await prisma.reportMessage.findMany({
            where: { reportId: id },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true,
                        isAdmin: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching report messages:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// Enviar mensaje en un reporte
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { id } = await context.params
        const { content } = await request.json()

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
        }

        // Verificar que el usuario tenga acceso (es reportero o es admin)
        const report = await prisma.report.findUnique({
            where: { id },
            select: { reporterId: true }
        })

        if (!report) {
            return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true }
        })

        if (report.reporterId !== session.user.id && !user?.isAdmin) {
            return NextResponse.json({ error: 'No tienes permiso para comentar en este reporte' }, { status: 403 })
        }

        const newMessage = await prisma.reportMessage.create({
            data: {
                reportId: id,
                senderId: session.user.id,
                content
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        image: true,
                        isAdmin: true
                    }
                }
            }
        })

        return NextResponse.json(newMessage)
    } catch (error) {
        console.error('Error creating report message:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
