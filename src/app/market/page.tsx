import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import MarketClient from "./MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { serializeDecimal } from "@/lib/serialize"
import { VEHICLE_CATEGORIES } from "@/lib/vehicleTaxonomy"

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
    category?: string
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
        select: { id: true, isAdmin: true, lastLatitude: true, lastLongitude: true }
    })

    if (!currentUser) {
        redirect("/auth")
    }

    const isAdmin = currentUser.isAdmin || currentUser.id === process.env.ADMIN_EMAIL // Fallback comparison

    // Construir query dinámico basado en filtros
    const where: any = {
        status: "ACTIVE",
    }

    // Si NO es admin, ocultar propios. Si ES admin, mostrarlos (para que pueda verse a sí mismo)
    if (!isAdmin) {
        where.userId = {
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
    } else if (searchParams.category && Object.keys(VEHICLE_CATEGORIES).includes(searchParams.category)) {
        // 🛠️ FIX: Si hay categoría pero no subtipo, filtrar por TODOS los tipos de esa categoría
        const categoryTypes = VEHICLE_CATEGORIES[searchParams.category as keyof typeof VEHICLE_CATEGORIES] || []
        if (categoryTypes.length > 0) {
            where.vehicleType = { in: categoryTypes }
        }
    }

    if (searchParams.transmission) {
        where.transmission = { in: searchParams.transmission.split(',') }
    }

    if (searchParams.fuel) {
        where.fuel = { in: searchParams.fuel.split(',') }
    }

    if (searchParams.color) {
        where.color = { in: searchParams.color.split(',') }
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

    // 🚜 Filtros Nuevos (Traction, Pasajeros, Horas)
    if (searchParams.traction) {
        where.traction = searchParams.traction
    }

    if (searchParams.passengers) {
        where.passengers = {
            gte: parseInt(searchParams.passengers)
        }
    }

    // "hours" param maps to "operatingHours" in DB
    if (searchParams.hours) {
        where.operatingHours = {
            lte: parseInt(searchParams.hours)
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

    // Registrar métrica de búsqueda para Inteligencia (Océanos Azules)
    if (searchParams.search || searchParams.brand || searchParams.vehicleType || searchParams.category) {
        // Ejecutar en segundo plano para no bloquear el renderizado
        prisma.searchMetric.create({
            data: {
                query: searchParams.search || null,
                category: (searchParams.category as string) || (searchParams.vehicleType as string) || null,
                userId: currentUser.id,
                // Tomamos la ubicación del usuario si está disponible, si no, intentamos por ciudad filter
                latitude: currentUser.lastLatitude || 0,
                longitude: currentUser.lastLongitude || 0
            }
        }).catch(err => console.error("Error saving SearchMetric:", err));
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
                    image: true,
                    isAdmin: true
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

    // Obtener SOLO negocios de administradores para inyectar en el feed (exclusividad solicitada)
    const businesses = await prisma.business.findMany({
        where: {
            isActive: true,
            // Si NO es admin, filtrar para mostrar SOLO los del admin
            // Si ES admin, mostrar también los propios
            user: {
                isAdmin: true
            }
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
                    image: true,
                    isAdmin: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    const itemsWithBoost = [
        ...vehiclesWithFavoriteStatus.map(v => ({
            ...v,
            feedType: 'VEHICLE' as const,
            isBoosted: v.user.isAdmin
        })),
        ...businesses.map(b => ({
            ...b,
            title: b.name,
            feedType: 'BUSINESS' as const,
            isBoosted: true // Todos los negocios en el feed son de admin ahora
        }))
    ]

    return (
        <MarketClient
            initialItems={serializeDecimal(itemsWithBoost) as any}
            currentUserId={currentUser.id}
            brands={brands}
            vehicleTypes={vehicleTypes}
            colors={colors}
            searchParams={searchParams}
        />
    )
}
