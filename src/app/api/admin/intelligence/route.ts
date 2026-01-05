import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true, email: true }
        })

        if (!user?.isAdmin && user?.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const stats = await Promise.all([
            // Coordenadas de búsquedas recientes (Demanda)
            prisma.searchMetric.findMany({
                where: {
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                },
                select: { latitude: true, longitude: true, category: true, query: true }
            }),
            // Coordenadas de vehículos (Oferta de inventario)
            prisma.vehicle.findMany({
                where: { status: 'ACTIVE' },
                select: { latitude: true, longitude: true, title: true }
            }),
            // Coordenadas de negocios actuales (Competencia)
            prisma.business.findMany({
                select: { latitude: true, longitude: true, name: true, category: true }
            })
        ])

        return NextResponse.json({
            searches: stats[0],
            vehicles: stats[1],
            businesses: stats[2]
        })

    } catch (error) {
        console.error('Intelligence API error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
