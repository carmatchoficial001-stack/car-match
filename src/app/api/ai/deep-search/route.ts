import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { query, context, filters } = await req.json()

        if (!query) {
            return NextResponse.json({ results: [] })
        }

        const keywords = query.toLowerCase().split(' ').filter((w: string) => w.length > 2)

        if (context === 'MAP') {
            // Búsqueda en Negocios (Servicios y Descripción)
            const businesses = await prisma.business.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { services: { hasSome: keywords } }
                    ]
                },
                select: { id: true, name: true, latitude: true, longitude: true, category: true }
            })
            return NextResponse.json({ results: businesses, type: 'BUSINESS' })
        } else {
            // Búsqueda en Vehículos (Descripción y Features)
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { features: { hasSome: keywords } }
                    ]
                },
                select: { id: true, title: true }
            })
            return NextResponse.json({ results: vehicles, type: 'VEHICLE' })
        }

    } catch (error) {
        console.error('Deep Search Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
