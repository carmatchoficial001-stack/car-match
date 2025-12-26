import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * POST /api/fraud/check
 * Endpoint para verificar si una publicación es fraude
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            deviceFingerprint,
            images,
            vehicleData,
            gpsLocation,
            description
        } = body

        // 1. Buscar publicaciones similares
        const similarPublications = await prisma.vehicle.findMany({
            where: {
                userId: { not: session.user.id }, // Diferentes usuarios
                brand: vehicleData.brand,
                model: vehicleData.model,
                year: vehicleData.year,
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        publicationFingerprints: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        })

        if (similarPublications.length === 0) {
            return NextResponse.json({
                isFraud: false,
                score: 0,
                action: 'ALLOW'
            })
        }

        // 2. Calcular fraud score para cada publicación similar
        let highestFraudScore = 0
        let matchedPublication = null

        for (const pub of similarPublications) {
            let fraudScore = 0

            // Device match
            const userDeviceFP = pub.user.publicationFingerprints[0]
            if (userDeviceFP && userDeviceFP.deviceHash === deviceFingerprint.visitorId) {
                fraudScore += 30
            }

            // GPS match (si hay datos)
            if (pub.latitude && pub.longitude && gpsLocation) {
                const distance = calculateDistance(
                    pub.latitude,
                    pub.longitude,
                    gpsLocation.latitude,
                    gpsLocation.longitude
                )

                if (distance < 50) fraudScore += 20
                else if (distance < 1000) fraudScore += 10
            }

            // Precio similar
            const pubPrice = pub.price.toNumber()
            if (Math.abs(pubPrice - vehicleData.price) / pubPrice < 0.1) {
                fraudScore += 10
            }

            if (fraudScore > highestFraudScore) {
                highestFraudScore = fraudScore
                matchedPublication = pub
            }
        }

        // 3. Decisión
        if (highestFraudScore > 70) {
            // FRAUDE - Redirigir
            return NextResponse.json({
                isFraud: true,
                score: highestFraudScore,
                action: 'REDIRECT',
                redirectTo: `/vehicle/${matchedPublication?.id}`,
                message: 'Ya publicaste este vehículo'
            })
        } else if (highestFraudScore > 50) {
            // SOSPECHOSO - Revisar
            return NextResponse.json({
                isFraud: false,
                score: highestFraudScore,
                action: 'VERIFY',
                message: 'Necesitamos verificar algunos datos'
            })
        } else {
            // LEGÍTIMO
            return NextResponse.json({
                isFraud: false,
                score: highestFraudScore,
                action: 'ALLOW'
            })
        }

    } catch (error) {
        console.error('Error in fraud check:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Helper: Calcular distancia entre coordenadas
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}
