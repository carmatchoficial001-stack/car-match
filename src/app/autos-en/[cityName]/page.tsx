import { prisma } from "@/lib/db"
import { serializeDecimal } from "@/lib/serialize"
import MarketClient from "../../market/MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { auth } from "@/lib/auth"
import { Metadata } from 'next'

export async function generateMetadata({
    params,
    searchParams: _searchParams
}: {
    params: Promise<{ cityName: string }>,
    searchParams: Promise<any>
}): Promise<Metadata> {
    const { cityName } = await params
    const city = decodeURIComponent(cityName)
    // 🚀 High-Intent SEO Title
    const title = `✓ Venta de Autos, Motos y Maquinaria en ${city} | CarMatch®`
    const description = `Explora el marketplace más grande de ${city}. Autos usados, motocicletas y maquinaria pesada con trato directo. ¡Compra o vende hoy mismo en CarMatch!`

    return {
        title,
        description,
        keywords: [`autos en ${city}`, `venta de autos ${city}`, `carros usados ${city}`, `motos en ${city}`, `John Deere ${city}`]
    }
}

export default async function CityPage({
    params,
    searchParams: _searchParams
}: {
    params: Promise<{ cityName: string }>,
    searchParams: Promise<any>
}) {
    const { cityName } = await params
    const city = decodeURIComponent(cityName)
    const session = await auth()

    // 🔓 Wikipedia Mode: Guests allowed
    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true }
        })
        : null

    const isAdmin = currentUser?.isAdmin || false
    const currentUserId = currentUser?.id || 'guest'

    // Obtener vehículos activos en esa ciudad
    const vehicles = await prisma.vehicle.findMany({
        where: {
            status: "ACTIVE",
            city: { contains: city, mode: 'insensitive' }
        },
        include: {
            user: {
                select: { name: true, image: true, isAdmin: true }
            },
            favorites: currentUser ? {
                where: { userId: currentUser.id },
                select: { id: true }
            } : {
                where: { id: 'none' },
                take: 0
            }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
    })

    const items = vehicles.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isFavorited: v.favorites.length > 0,
        isBoosted: v.user.isAdmin
    }))

    // Obtener opciones únicas para filtros
    const [brands, vehicleTypes, colors] = await Promise.all([
        getCachedBrands(),
        getCachedVehicleTypes(),
        getCachedColors()
    ])

    return (
        <div className="min-h-screen bg-background">
            <div className="pt-24 px-6 max-w-7xl mx-auto text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-black mb-2 text-text-primary uppercase tracking-tighter">
                    COMPRA Y VENTA EN <span className="text-primary-500">{city}</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl">
                    Los vehículos más buscados por la comunidad de CarMatch en {city}. Trato directo, sin comisiones.
                </p>
            </div>

            <MarketClient
                initialItems={serializeDecimal(items) as any}
                currentUserId={currentUserId}
                brands={brands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={{}}
            />
        </div>
    )
}
