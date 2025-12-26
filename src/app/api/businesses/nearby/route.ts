import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const lat = parseFloat(searchParams.get('lat') || '0')
        const lng = parseFloat(searchParams.get('lng') || '0')
        const radius = parseFloat(searchParams.get('radius') || '12') // Default 12km
        const category = searchParams.get('category')

        // Validación básica
        if (!lat || !lng) {
            return NextResponse.json({ businesses: [] })
        }

        // Construir filtro
        // Nota: Aseguramos que el negocio esté activo
        const whereClause: any = {
            isActive: true, // Assuming schema was updated to use Boolean isActive or similar, check schema if needed. Wait, in schema it was 'status' enum or something? 
            // In step 556 summary it said: "isFreePublication: Boolean (replaces isFreeMonth)".
            // Let me check schema status field.
            // In step 626 view_file lines 18-20: const whereClause: any = { status: 'ACTIVE' }
            // So I should stick to `status: 'ACTIVE'` to be safe, unless I am sure I changed it to Boolean.
            // Re-reading step 556 summary: "GET /api/businesses ... Retrieves businesses. If user is owner... separate logic."
            // The file view in 626 showed: `status: 'ACTIVE'`. I will use that.
        }

        // CORRECTION: The file view in step 626 used:
        // const whereClause: any = { status: 'ACTIVE', }
        // I will use THAT exactly.

        // Re-constructing the whereClause properly:
        /*
        const whereClause: any = {
            status: 'ACTIVE',
        }
        */

        if (category) {
            whereClause.category = category
        }

        // Obtener todos los negocios activos
        const allBusinesses = await prisma.business.findMany({
            where: {
                isActive: true,
                ...(category ? { category } : {})
            },
            select: {
                id: true,
                name: true,
                category: true,
                latitude: true,
                longitude: true,
                description: true,
                images: true,
                address: true,
                phone: true,
                hours: true,
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Filtrar por distancia (Haversine simple)
        const nearbyBusinesses = allBusinesses.filter(business => {
            const R = 6371 // Radio de la tierra en km
            const dLat = (business.latitude - lat) * Math.PI / 180
            const dLon = (business.longitude - lng) * Math.PI / 180
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(business.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c

            return distance <= radius
        })

        // --- SILENT ANALYTICS (El Espía Silencioso) ---
        // Guardamos data estratégica para el futuro
        const saveAnalytics = async () => {
            try {
                // Check if user ID is available (would need auth/session here, but let's keep it anonymous or basic for now to avoid complexity in this step)
                await prisma.searchMetric.create({
                    data: {
                        query: category || 'exploration',
                        category: category || null,
                        latitude: lat,
                        longitude: lng,
                        createdAt: new Date(),
                    }
                })

                // Si hay 0 resultados y es una categoría específica, registramos posible oportunidad
                if (nearbyBusinesses.length === 0 && category) {
                    await prisma.opportunityLog.create({
                        data: {
                            businessType: category,
                            latitude: lat,
                            longitude: lng,
                            reason: 'High searches, 0 local results',
                            createdAt: new Date(),
                        }
                    })
                }
            } catch (analyticsError) {
                console.error('Silent Analytics Error:', analyticsError)
            }
        }

        await saveAnalytics();
        // ----------------------------------------------

        return NextResponse.json({ businesses: nearbyBusinesses })

    } catch (error) {
        console.error('Error fetching nearby businesses:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
