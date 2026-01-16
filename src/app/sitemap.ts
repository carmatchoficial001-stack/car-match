import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

// URL Base del sitio (ajustar a dominio real en producción)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://carmatch.mx'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Obtener Vehículos Activos (Limitado a 5000 para no saturar memoria en Vercel)
    const vehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000
    })

    // 2. Obtener Negocios Activos
    const businesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000
    })

    // 3. Mapear Vehículos
    const vehicleUrls = vehicles.map((vehicle) => ({
        url: `${BASE_URL}/vehicle/${vehicle.id}`,
        lastModified: vehicle.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }))

    // 4. Mapear Negocios
    const businessUrls = businesses.map((business) => ({
        url: `${BASE_URL}/business/${business.id}`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    // 5. Rutas Estáticas
    const staticRoutes = [
        '',
        '/market',
        '/map-store',
        '/swipe',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
    }))

    return [...staticRoutes, ...vehicleUrls, ...businessUrls]
}
