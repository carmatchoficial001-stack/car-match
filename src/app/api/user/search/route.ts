import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/user/search?q=query - Buscar usuarios por nombre o email
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 3) {
            return NextResponse.json({ users: [] })
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    { id: { not: session.user.id } } // No buscarse a sí mismo
                ]
            },
            select: {
                id: true,
                name: true,
                image: true
            },
            take: 5
        })

        return NextResponse.json({ users })

    } catch (error) {
        console.error('Error buscando usuarios:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
