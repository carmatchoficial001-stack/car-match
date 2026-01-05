import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import MarketClient from "./MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { serializeDecimal } from "@/lib/serialize"

interface SearchParams {
    search?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    minYear?: string
    maxYear?: string
    vehicleType?: string
    transmission?: string
    fuel?: string
    color?: string
    condition?: string
    doors?: string
    minMileage?: string
    maxMileage?: string
    minDisplacement?: string
    maxDisplacement?: string
    minCargoCapacity?: string
    maxCargoCapacity?: string
    sort?: string
    features?: string
}

export default async function MarketPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<SearchParams>
}) {
    const searchParams = await searchParamsPromise
    const session = await auth()

    if (!session?.user) {
        redirect("/auth")
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true }
    })

    if (!currentUser) {
        redirect("/auth")
    }


    // Construir query dinámico basado en filtros (sin filtrar por ciudad - se hará con GPS)
    const where: any = {
        status: "ACTIVE",
        userId: {
            not: currentUser.id
        }
    }

    // Aplicar filtros manuales
    if (searchParams.brand) {
        where.brand = searchParams.brand
    }

    if (searchParams.minPrice || searchParams.maxPrice) {
        where.price = {}
        if (searchParams.minPrice) {
            where.price.gte = parseFloat(searchParams.minPrice)
        }
        if (searchParams.maxPrice) {
            where.price.lte = parseFloat(searchParams.maxPrice)
        }
    }

    if (searchParams.minYear || searchParams.maxYear) {
        where.year = {}
        if (searchParams.minYear) {
            where.year.gte = parseInt(searchParams.minYear)
        }
        if (searchParams.maxYear) {
            where.year.lte = parseInt(searchParams.maxYear)
        }
    }

    if (searchParams.vehicleType) {
        where.vehicleType = searchParams.vehicleType
    }

    if (searchParams.transmission) {
        where.transmission = searchParams.transmission
    }

    if (searchParams.fuel) {
        where.fuel = searchParams.fuel
    }

    if (searchParams.color) {
        where.color = searchParams.color
    }

    if (searchParams.doors) {
        where.doors = parseInt(searchParams.doors)
    }

    if (searchParams.minMileage || searchParams.maxMileage) {
        where.mileage = {}
        if (searchParams.minMileage) {
            where.mileage.gte = parseInt(searchParams.minMileage)
        }
        if (searchParams.maxMileage) {
            where.mileage.lte = parseInt(searchParams.maxMileage)
        }
    }

    if (searchParams.condition) {
        where.condition = searchParams.condition
    }

    // Filtros específicos por tipo de vehículo
    if (searchParams.minDisplacement || searchParams.maxDisplacement) {
        where.displacement = {}
        if (searchParams.minDisplacement) {
            where.displacement.gte = parseInt(searchParams.minDisplacement)
        }
        if (searchParams.maxDisplacement) {
            where.displacement.lte = parseInt(searchParams.maxDisplacement)
        }
    }

    if (searchParams.minCargoCapacity || searchParams.maxCargoCapacity) {
        where.cargoCapacity = {}
        if (searchParams.minCargoCapacity) {
            where.cargoCapacity.gte = parseFloat(searchParams.minCargoCapacity)
        }
        if (searchParams.maxCargoCapacity) {
            where.cargoCapacity.lte = parseFloat(searchParams.maxCargoCapacity)
        }
    }

    // Búsqueda por texto en título y descripción
    if (searchParams.search) {
        where.OR = [
            { title: { contains: searchParams.search, mode: 'insensitive' } },
            { description: { contains: searchParams.search, mode: 'insensitive' } },
            { brand: { contains: searchParams.search, mode: 'insensitive' } },
            { model: { contains: searchParams.search, mode: 'insensitive' } }
        ]
    }

    // Filtros de Características (Premium)
    if (searchParams.features) {
        const featuresList = searchParams.features.split(',').filter(Boolean)
        if (featuresList.length > 0) {
            // Mapeo de keys de frontend a nombres reales en DB si es necesario
            // Asumimos que la DB guarda strings como "GPS", "Quemacocos", etc.
            // Aquí hacemos un mapeo simple para demostración, idealmente sincronizado con constantes
            const featureMap: Record<string, string> = {
                gps: "GPS",
                leather: "Asientos de piel",
                sunroof: "Quemacocos",
                ac: "Aire Acondicionado",
                bluetooth: "Bluetooth",
                camera: "Cámara de reversa",
                sensors: "Sensores",
                android_carplay: "Android Auto",
                heated_seats: "Asientos calefactables"
            }

            const dbFeatures = featuresList.map(f => featureMap[f] || f)

            where.features = {
                hasEvery: dbFeatures
            }
        }
    }

    // Ordenamiento
    let orderBy: any = { createdAt: "desc" } // Default

    switch (searchParams.sort) {
        case 'price_asc':
            orderBy = { price: 'asc' }
            break
        case 'price_desc':
            orderBy = { price: 'desc' }
            break
        case 'year_asc':
            orderBy = { year: 'asc' }
            break
        case 'year_desc':
            orderBy = { year: 'desc' }
            break
        case 'mileage_asc':
            orderBy = { mileage: 'asc' }
            break
        case 'newest':
        default:
            orderBy = { createdAt: 'desc' }
            break
    }

    // Obtener vehículos con filtros aplicados
    const vehicles = await prisma.vehicle.findMany({
        where,
        select: {
            id: true,
            title: true,
            description: true,
            brand: true,
            model: true,
            year: true,
            price: true,
            city: true,
            country: true, // Para frontera digital
            latitude: true,
            longitude: true,
            transmission: true,
            mileage: true,
            images: true,
            color: true,
            vehicleType: true,
            user: {
                select: {
                    name: true,
                    image: true
                }
            },
            _count: {
                select: {
                    favorites: true
                }
            },
            favorites: {
                where: {
                    userId: currentUser.id
                },
                select: {
                    id: true
                }
            }
        },
        orderBy
    })

    const vehiclesWithFavoriteStatus = vehicles.map(vehicle => ({
        ...vehicle,
        isFavorited: vehicle.favorites.length > 0,
        favorites: undefined // Remove the array to keep payload clean
    }))

    // Obtener opciones únicas para filtros (sin filtrar por ciudad)
    // 🚀 OPTIMIZATION: Usar datos cacheados en lugar de consultar BD cada vez
    const [brands, vehicleTypes, colors] = await Promise.all([
        getCachedBrands(),
        getCachedVehicleTypes(),
        getCachedColors()
    ])

    // Obtener negocios activos para inyectar en el feed
    const businesses = await prisma.business.findMany({
        where: {
            isActive: true,
            userId: { not: currentUser.id }
        },
        select: {
            id: true,
            name: true,
            category: true,
            city: true,
            latitude: true,
            longitude: true,
            images: true,
            country: true,
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    const initialItems = [
        ...vehiclesWithFavoriteStatus.map(v => ({ ...v, feedType: 'VEHICLE' as const })),
        ...businesses.map(b => ({ ...b, title: b.name, feedType: 'BUSINESS' as const }))
    ]

    return (
        <MarketClient
            initialItems={serializeDecimal(initialItems) as any}
            currentUserId={currentUser.id}
            brands={brands}
            vehicleTypes={vehicleTypes}
            colors={colors}
            searchParams={searchParams}
        />
    )
}
