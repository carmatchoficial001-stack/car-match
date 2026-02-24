// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { MetadataRoute } from 'next'

// ⚡ Forzar generación dinámica (runtime) para que Prisma no se ejecute en build time
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db'
import { generateVehicleSlug, generateBusinessSlug } from '@/lib/slug'

// URL Base del sitio (ajustar a dominio real en producción)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://carmatchapp.net'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Obtener Vehículos Activos (Limitado a 5000 para no saturar memoria en Vercel)
    const vehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, updatedAt: true, brand: true, model: true, year: true, city: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000
    })

    // 2. Obtener Negocios Activos
    const businesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, updatedAt: true, city: true, category: true },
        orderBy: { updatedAt: 'desc' },
        take: 20000
    })

    // 2.1 Generar rutas de Directorio Local (Ciudad + Categoría)
    const directoryUrls: any[] = []
    const processedCombos = new Set<string>()

    businesses.forEach(b => {
        if (b.city && b.category) {
            const combo = `${b.city.toLowerCase()}-${b.category.toLowerCase()}`
            if (!processedCombos.has(combo)) {
                processedCombos.add(combo)
                directoryUrls.push({
                    url: `${BASE_URL}/negocios/${encodeURIComponent(b.city.toLowerCase())}/${encodeURIComponent(b.category.toLowerCase())}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.9,
                })
            }
        }
    })

    // 2.2 Generar rutas de Ciudad de Vehículos (/autos-en/[ciudad])
    const cityVehicleUrls: any[] = []
    const processedCities = new Set<string>()

    const allVehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: { city: true },
    })

    allVehicles.forEach(v => {
        if (v.city) {
            const cityKey = v.city.toLowerCase()
            if (!processedCities.has(cityKey)) {
                processedCities.add(cityKey)
                cityVehicleUrls.push({
                    url: `${BASE_URL}/autos-en/${encodeURIComponent(cityKey)}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily' as const,
                    priority: 0.95,
                })
            }
        }
    })

    // 3. Mapear Vehículos (Ultimate SEO Semantic URLs)
    const vehicleUrls = vehicles.map((vehicle) => {
        const slug = generateVehicleSlug(vehicle.brand || '', vehicle.model || '', vehicle.year || 0, vehicle.city)
        return {
            url: `${BASE_URL}/comprar/${slug}-${vehicle.id}`,
            lastModified: vehicle.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 1.0,
        }
    })

    // 4. Mapear Negocios (SEO Dinámico)
    const businessUrls = businesses.map((business) => {
        const slug = generateBusinessSlug(business.name, business.city || '')
        return {
            url: business.slug ? `${BASE_URL}/${business.slug}` : `${BASE_URL}/negocio/${slug}-${business.id}`,
            lastModified: business.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }
    })

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

    return [...staticRoutes, ...directoryUrls, ...cityVehicleUrls, ...vehicleUrls, ...businessUrls]
}
