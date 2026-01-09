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

        let models: any[] = []

        if (brandId) {
            models = await prisma.model.findMany({
                where: { brandId: brandId, isActive: true },
                select: {
                    id: true,
                    name: true,
                    yearIntroduced: true,
                    isElectric: true,
                    isHybrid: true
                },
                orderBy: { name: 'asc' }
            })
        } else if (brandName) {
            const brand = await prisma.brand.findUnique({
                where: { name: brandName }
            })

            if (brand) {
                models = await prisma.model.findMany({
                    where: { brandId: brand.id, isActive: true },
                    select: {
                        id: true,
                        name: true,
                        yearIntroduced: true,
                        isElectric: true,
                        isHybrid: true
                    },
                    orderBy: { name: 'asc' }
                })
            }
        }


        // 🔥 FALLBACK: Si no existe la marca en DB o no tiene modelos, usar datos estáticos
        if (models.length === 0 && brandName) {
            const { POPULAR_MODELS } = await import('@/lib/vehicleTaxonomy');
            const staticModels = POPULAR_MODELS[brandName];

            if (staticModels && staticModels.length > 0) {
                return NextResponse.json(staticModels.map((name, index) => ({
                    id: `static-${index}`,
                    name: name
                })));
            }

            // Si tampoco hay estáticos, intentar IA
            const { suggestModelsForBrand } = await import('@/lib/ai/vehicleScanner');
            const suggestions = await suggestModelsForBrand(brandName);

            if (suggestions.length > 0) {
                return NextResponse.json(suggestions.map((name, index) => ({
                    id: `ai-${index}`,
                    name: name,
                    isAiGenerated: true
                })));
            }
        }

        return NextResponse.json(models)
    } catch (error) {
        console.error('Error fetching models:', error)
        return NextResponse.json(
            { error: 'Failed to fetch models' },
            { status: 500 }
        )
    }
}
