import { prisma } from "@/lib/db"
import { Metadata } from 'next'
import MarketClient from "../../../market/MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { serializeDecimal } from "@/lib/serialize"
import { auth } from "@/lib/auth"

interface Props {
    params: Promise<{ brand: string, model: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { brand, model } = await params
    const brandName = decodeURIComponent(brand)
    const modelName = decodeURIComponent(model)
    const title = `✓ ${brandName} ${modelName} Usados y Seminuevos - Precios y Modelos | CarMatch®`
    return {
        title,
        description: `Encuentra las mejores ofertas de ${brandName} ${modelName} en México. Compara precios, años y specs técnicas. Compra segura y trato directo en CarMatch.`,
        keywords: [`${brandName} ${modelName} precio`, `${modelName} usado`, `comprar ${modelName} mexico`]
    }
}

export default async function ModelPage({ params }: Props) {
    const { brand, model } = await params
    const brandName = decodeURIComponent(brand)
    const modelName = decodeURIComponent(model)
    const session = await auth()

    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })
        : null

    const currentUserId = currentUser?.id || 'guest'

    const vehicles = await prisma.vehicle.findMany({
        where: {
            status: "ACTIVE",
            brand: { contains: brandName, mode: 'insensitive' },
            model: { contains: modelName, mode: 'insensitive' }
        },
        include: {
            user: { select: { name: true, image: true, isAdmin: true } },
            favorites: currentUser ? {
                where: { userId: currentUser.id },
                select: { id: true }
            } : { where: { id: 'none' }, take: 0 }
        },
        take: 30,
        orderBy: { createdAt: 'desc' }
    })

    const items = vehicles.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isFavorited: v.favorites.length > 0,
        isBoosted: v.user.isAdmin
    }))

    const [allBrands, vehicleTypes, colors] = await Promise.all([
        getCachedBrands(),
        getCachedVehicleTypes(),
        getCachedColors()
    ])

    return (
        <div className="min-h-screen bg-background">
            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black mb-2 text-text-primary uppercase tracking-tighter">
                    {brandName} <span className="text-primary-500">{modelName}</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl">
                    Todos los modelos {modelName} disponibles actualmente. Filtra por año, kilometraje y color para encontrar el ideal.
                </p>
            </div>

            <MarketClient
                initialItems={serializeDecimal(items) as any}
                currentUserId={currentUserId}
                brands={allBrands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={{ brand: brandName, model: modelName }}
            />
        </div>
    )
}
