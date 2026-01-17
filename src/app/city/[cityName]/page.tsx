import { prisma } from "@/lib/db"
import { serializeDecimal } from "@/lib/serialize"
import MarketClient from "../../market/MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function generateMetadata({
    params,
    searchParams
}: {
    params: Promise<{ cityName: string }>,
    searchParams: Promise<any>
}) {
    const { cityName } = await params
    const city = decodeURIComponent(cityName)
    return {
        title: `Autos, Motos y Talleres en ${city} | CarMatch`,
        description: `Encuentra los mejores vehículos y servicios automotrices en ${city}. Explora el marketplace y el mapa de negocios en tiempo real.`,
        keywords: [`autos en ${city}`, `talleres en ${city}`, `comprar carro en ${city}`, `mecánicos ${city}`]
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

    if (!session?.user) {
        redirect("/auth")
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, isAdmin: true }
    })

    if (!currentUser) {
        redirect("/auth")
    }

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
            favorites: {
                where: { userId: currentUser.id },
                select: { id: true }
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
            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <h1 className="text-4xl font-black mb-2 text-text-primary uppercase">
                    CARMATCH EN <span className="text-primary-500">{city}</span>
                </h1>
                <p className="text-gray-400 mb-8">
                    Explorando los vehículos más recientes publicados cerca de {city}.
                </p>
            </div>

            <MarketClient
                initialItems={serializeDecimal(items) as any}
                currentUserId={currentUser.id}
                brands={brands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={{}}
            />
        </div>
    )
}
