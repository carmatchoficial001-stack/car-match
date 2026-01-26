import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import MarketClient from "./MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { serializeDecimal } from "@/lib/serialize"
import { VEHICLE_CATEGORIES, COLORS, GLOBAL_SYNONYMS, BRANDS } from "@/lib/vehicleTaxonomy"

export const metadata = {
    title: "MarketCar | Venta de Autos, Motos, Tractores y Maquinaria Pesada",
    description: "La mayor variedad de vehículos en un solo lugar. Compra y vende autos (Toyota, Nissan, Ford), motocicletas (Italika, Yamaha), tractores (John Deere), camiones y maquinaria pesada. Filtros profesionales en CarMatch.",
    keywords: [
        "Toyota en venta", "Nissan usados", "Honda Civic", "Ford F-150",
        "venta de motos", "Italika", "Yamaha R6", "KTM",
        "tractores agrícolas", "John Deere", "Massey Ferguson", "maquinaria pesada",
        "camiones de carga", "remolques", "semirremolques",
        "autos baratos Juárez", "camionetas 4x4", "BMW seminuevos", "vender mi auto gratis"
    ]
}

interface SearchParams {
    search?: string
    brand?: string
    model?: string
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
    traction?: string
    passengers?: string
    hours?: string
    cylinders?: string
    hp?: string
}

export default async function MarketPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<SearchParams>
}) {
    const searchParams = await searchParamsPromise
    const session = await auth()
    const cookieStore = await cookies()
    const isSoftLogout = cookieStore.get('soft_logout')?.value === 'true'

    // Obtener usuario si está logueado, si no, modo guest

    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true, lastLatitude: true, lastLongitude: true }
        })
        : null

    const isAdmin = currentUser?.isAdmin || currentUser?.id === process.env.ADMIN_EMAIL
    const currentUserId = currentUser?.id || 'guest'

    // Construir query dinámico basado en filtros
    const where: any = {
        status: "ACTIVE",
    }

    // Si NO es admin, ocultar propios. Si ES admin, mostrarlos. Invitados ven todo.
    // 🔥 NEW: Si está en Modo Invitado (soft_logout), sí mostramos sus vehículos para que pueda ver cómo quedaron.
    if (!isAdmin && currentUser && !isSoftLogout) {
        where.userId = {
            not: currentUser.id
        }
    }


    // Aplicar filtros manuales (Soporte para múltiples valores con coma)
    if (searchParams.brand) {
        const brands = searchParams.brand.split(',').map(b => b.trim())
        if (brands.length > 1) {
            where.brand = { in: brands, mode: 'insensitive' }
        } else {
            where.brand = { contains: brands[0], mode: 'insensitive' }
        }
    }

    if (searchParams.model) {
        const models = searchParams.model.split(',').map(m => m.trim())
        if (models.length > 1) {
            where.model = { in: models, mode: 'insensitive' }
        } else {
            where.model = { contains: models[0], mode: 'insensitive' }
        }
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
        const colors = searchParams.color.split(',')
        if (colors.length === 1) {
            where.color = { contains: colors[0], mode: 'insensitive' }
        } else {
            where.color = { in: colors }
        }
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

    // 🔧 Filtro Inteligente de Cilindros (Tolerante a datos legacy)
    if (searchParams.cylinders) {
        const cyl = parseInt(searchParams.cylinders)

        // Buscar en TRES lugares:
        // 1. Campo cylinders (vehículos nuevos/editados)
        // 2. Campo engine (puede tener "V6", "6 cil", etc.)
        // 3. Título/descripción (vehículos antiguos con "V6" en texto)
        where.OR = where.OR || []
        where.OR.push(
            { cylinders: cyl }, // Exacto
            { engine: { contains: `V${cyl}`, mode: 'insensitive' } }, // "V6", "v6"
            { engine: { contains: `${cyl} cil`, mode: 'insensitive' } }, // "6 cilindros", "6 cil"
            { title: { contains: `V${cyl}`, mode: 'insensitive' } }, // "RAM V6" en título
            { description: { contains: `V${cyl}`, mode: 'insensitive' } } // "motor V6" en descripción
        )
    }

    if (searchParams.hp) {
        // Búsqueda de rango flexible (+/- 10%) o valor mínimo si la IA lo sugiere
        // Por simplicidad para "450 hp", buscamos que tenga al menos esa potencia o un rango cercano
        const hpVal = parseInt(searchParams.hp)
        where.hp = {
            gte: hpVal - 20, // Rango de tolerancia
            lte: hpVal + 50
        }
    }



    // Intelligent Broad Text Search (Fallback if AI doesn't run)
    if (searchParams.search) {
        const query = searchParams.search.toLowerCase()
        const searchTerms = query.split(' ').filter(t => t.length >= 2)

        // 🧠 Proactive Filter Extraction: Avoid "Green trucks for 'Ram negra'"
        const extractedColors: string[] = []
        const extractedBrands: string[] = []
        const allBrands = Array.from(new Set(Object.values(BRANDS).flat()))

        searchTerms.forEach(term => {
            // Check direct colors
            const exactColor = COLORS.find(c => c.toLowerCase() === term)
            if (exactColor) extractedColors.push(exactColor)

            // Check brands (RAM, Toyota, etc)
            const exactBrand = allBrands.find(b => b.toLowerCase() === term)
            if (exactBrand) extractedBrands.push(exactBrand)

            // Check global synonyms (e.g. "negra" -> "Negro", "vocho" -> "Volkswagen")
            Object.keys(GLOBAL_SYNONYMS).forEach(syn => {
                if (syn.toLowerCase() === term) {
                    const destination = GLOBAL_SYNONYMS[syn]
                    if (COLORS.includes(destination)) extractedColors.push(destination)
                    if (allBrands.includes(destination)) extractedBrands.push(destination)
                }
            })
        })

        // If specific attributes are mentioned, enforce them as restrictive filters
        // Using 'OR' with 'contains' to match variants (e.g. "Gris" matches "Gris obscuro")
        if (extractedColors.length > 0) {
            if (extractedColors.length === 1) {
                where.color = { contains: extractedColors[0], mode: 'insensitive' }
            } else {
                where.AND = where.AND || []
                where.AND.push({
                    OR: extractedColors.map(c => ({ color: { contains: c, mode: 'insensitive' } }))
                })
            }
        }

        if (extractedBrands.length > 0) {
            if (extractedBrands.length === 1) {
                where.brand = { contains: extractedBrands[0], mode: 'insensitive' }
            } else {
                where.AND = where.AND || []
                where.AND.push({
                    OR: extractedBrands.map(b => ({ brand: { contains: b, mode: 'insensitive' } }))
                })
            }
        }

        // Build OR conditions for terms that are NOT specific filters
        where.OR = [
            { title: { contains: searchParams.search, mode: 'insensitive' } },
            { description: { contains: searchParams.search, mode: 'insensitive' } },
            { brand: { contains: searchParams.search, mode: 'insensitive' } },
            { model: { contains: searchParams.search, mode: 'insensitive' } }
        ]

        // Add matches for individual terms
        searchTerms.forEach(term => {
            where.OR.push({ title: { contains: term, mode: 'insensitive' } })
            where.OR.push({ brand: { contains: term, mode: 'insensitive' } })
            where.OR.push({ model: { contains: term, mode: 'insensitive' } })
        })
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
    if (searchParams.search || searchParams.brand || searchParams.vehicleType || searchParams.category || searchParams.model) {
        // Ejecutar en segundo plano para no bloquear el renderizado
        prisma.searchMetric.create({
            data: {
                query: searchParams.search || null,
                category: searchParams.category || null,
                vehicleType: searchParams.vehicleType || null,
                brand: searchParams.brand || null,
                model: searchParams.model || null,
                minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : null,
                maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null,
                minYear: searchParams.minYear ? parseInt(searchParams.minYear) : null,
                maxYear: searchParams.maxYear ? parseInt(searchParams.maxYear) : null,
                color: searchParams.color || null,
                transmission: searchParams.transmission || null,
                fuel: searchParams.fuel || null,
                cylinders: searchParams.cylinders ? parseInt(searchParams.cylinders) : null,
                features: searchParams.features ? searchParams.features.split(',') : [],
                userId: currentUser?.id || null,
                latitude: currentUser?.lastLatitude || 0,
                longitude: currentUser?.lastLongitude || 0
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
            favorites: currentUser ? {
                where: {
                    userId: currentUser.id
                },
                select: {
                    id: true
                }
            } : {
                where: { id: 'none' }, // Consulta vacía segura para invitados
                take: 0
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

    const items = vehiclesWithFavoriteStatus.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isBoosted: v.user.isAdmin
    }))

    return (
        <MarketClient
            initialItems={serializeDecimal(items) as any}
            currentUserId={currentUserId}
            brands={brands}
            vehicleTypes={vehicleTypes}
            colors={colors}
            searchParams={searchParams}
        />
    )
}
