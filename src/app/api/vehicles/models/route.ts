import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const brandId = searchParams.get('brandId')
        const brandName = searchParams.get('brandName')

        if (!brandId && !brandName) {
            return NextResponse.json(
                { error: 'brandId or brandName required' },
                { status: 400 }
            )
        }

        // Buscar por ID o por nombre
        const whereClause: any = { isActive: true }

        if (brandId) {
            whereClause.brandId = brandId
        } else if (brandName) {
            const brand = await prisma.brand.findUnique({
                where: { name: brandName }
            })
            if (!brand) {
                return NextResponse.json([])
            }
            whereClause.brandId = brand.id
        }

        const models = await prisma.model.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                yearIntroduced: true,
                isElectric: true,
                isHybrid: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(models)
    } catch (error) {
        console.error('Error fetching models:', error)
        return NextResponse.json(
            { error: 'Failed to fetch models' },
            { status: 500 }
        )
    }
}
