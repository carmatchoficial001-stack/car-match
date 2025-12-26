import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

/**
 * 🚀 PERFORMANCE CACHE
 * 
 * Este archivo contiene funciones optimizadas que usan el cache de Next.js
 * para evitar consultar la base de datos repetidamente por datos que raramente cambian.
 */

// Cachear marcas por 1 hora (3600s)
export const getCachedBrands = unstable_cache(
    async () => {
        const brands = await prisma.vehicle.findMany({
            where: { status: "ACTIVE" },
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' }
        })
        return brands.map(b => b.brand)
    },
    ['active-brands-list'],
    { revalidate: 3600, tags: ['taxonomy'] }
)

// Cachear tipos de vehículos por 24 horas (86400s)
export const getCachedVehicleTypes = unstable_cache(
    async () => {
        const types = await prisma.vehicle.findMany({
            where: { status: "ACTIVE", vehicleType: { not: null } },
            select: { vehicleType: true },
            distinct: ['vehicleType'],
            orderBy: { vehicleType: 'asc' }
        })
        return types.map(t => t.vehicleType!).filter(Boolean)
    },
    ['active-vehicle-types-list'],
    { revalidate: 86400, tags: ['taxonomy'] }
)

// Cachear colores por 24 horas
export const getCachedColors = unstable_cache(
    async () => {
        const colors = await prisma.vehicle.findMany({
            where: { status: "ACTIVE", color: { not: null } },
            select: { color: true },
            distinct: ['color'],
            orderBy: { color: 'asc' }
        })
        return colors.map(c => c.color!).filter(Boolean)
    },
    ['active-colors-list'],
    { revalidate: 86400, tags: ['taxonomy'] }
)
