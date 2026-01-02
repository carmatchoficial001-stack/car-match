import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVehicleHash, hashImageUrl, normalizePriceRange, hashGPSLocation } from '@/lib/vehicleHash'

/**
 * POST /api/fraud/check
 * Endpoint para verificar si una publicación es fraude o requiere crédito
 * 
 * POLÍTICA DE MONETIZACIÓN ACTUALIZADA:
 * - Primer vehículo: 6 mes gratis
 * - Vehículos adicionales: 7 días gratis → luego 1 crédito/mes
 * - Republicación de mismo vehículo: COBRAR crédito inmediatamente (no bloquear)
 * - Segundo vehículo idéntico: COBRAR crédito siempre
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
        } = body

        console.log(`🔍 [FRAUD CHECK] Usuario: ${session.user.id} | Vehículo: ${vehicleData.brand} ${vehicleData.model} ${vehicleData.year}`);

        // 1. Generar huella única del vehículo
        const priceRange = normalizePriceRange(vehicleData.price);
        const coverImageHash = await hashImageUrl(images[0]);
        const vehicleHash = generateVehicleHash({
            brand: vehicleData.brand,
            model: vehicleData.model,
            year: vehicleData.year,
            priceRange,
            coverImageHash
        });

        const gpsHash = hashGPSLocation(gpsLocation?.latitude, gpsLocation?.longitude);

        console.log(`🔑 Vehicle Hash: ${vehicleHash.substring(0, 12)}... | GPS Hash: ${gpsHash?.substring(0, 8) || 'N/A'}`);

        // 2. Contar cuántos vehículos activos tiene el usuario
        const activeVehiclesCount = await prisma.vehicle.count({
            where: {
                userId: session.user.id,
                status: 'ACTIVE'
            }
        });

        console.log(`📊 Usuario tiene ${activeVehiclesCount} vehículos activos`);

        // 3. Buscar si este VEHÍCULO EXACTO ya fue publicado por ESTE USUARIO
        const userVehicles = await prisma.vehicle.findMany({
            where: {
                userId: session.user.id,
                brand: vehicleData.brand,
                model: vehicleData.model,
                year: vehicleData.year,
                OR: [
                    { status: 'ACTIVE' },
                    { status: 'INACTIVE' },
                    { status: 'SOLD' }
                ]
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 5
        });

        // 4. Detectar republicación (mismo vehículo que ya existió)
        for (const existingVehicle of userVehicles) {
            // Calcular similaridad
            let similarityScore = 0;

            // Marca + Modelo + Año exactos
            if (existingVehicle.brand === vehicleData.brand &&
                existingVehicle.model === vehicleData.model &&
                existingVehicle.year === vehicleData.year) {
                similarityScore += 40;
            }

            // Precio similar (±10%)
            const existingPrice = existingVehicle.price.toNumber();
            if (Math.abs(existingPrice - vehicleData.price) / existingPrice < 0.1) {
                similarityScore += 20;
            }

            // Primera imagen similar (comparar URLs)
            if (existingVehicle.images.length > 0 && images.length > 0) {
                // Si la URL es exactamente la misma (republicación con misma foto)
                if (existingVehicle.images[0] === images[0]) {
                    similarityScore += 30;
                } else {
                    // Si al menos comparten alguna foto
                    const sharedImages = existingVehicle.images.filter(img => images.includes(img));
                    if (sharedImages.length > 0) {
                        similarityScore += 15;
                    }
                }
            }

            // GPS cercano (si ambos tienen)
            if (existingVehicle.latitude && existingVehicle.longitude && gpsLocation?.latitude && gpsLocation?.longitude) {
                const distance = calculateDistance(
                    existingVehicle.latitude,
                    existingVehicle.longitude,
                    gpsLocation.latitude,
                    gpsLocation.longitude
                );
                if (distance < 1000) { // Menos de 1km
                    similarityScore += 10;
                }
            }

            console.log(`🎯 Similaridad con vehículo ${existingVehicle.id}: ${similarityScore}%`);

            // Si es MUY similar (>= 70%), es probable que sea el mismo vehículo
            if (similarityScore >= 70) {
                const daysSinceLastUpdate = Math.floor(
                    (new Date().getTime() - new Date(existingVehicle.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                console.log(`⚠️ VEHÍCULO DUPLICADO DETECTADO | Status: ${existingVehicle.status} | Hace ${daysSinceLastUpdate} días`);

                // Si el vehículo anterior fue marcado como SOLD/INACTIVE y están intentando republicar
                if (existingVehicle.status === 'SOLD' || existingVehicle.status === 'INACTIVE') {
                    // POLÍTICA: Cobrar crédito, NO bloquear
                    return NextResponse.json({
                        action: 'REQUIRE_CREDIT',
                        isFraud: false,
                        score: similarityScore,
                        message: `Ya publicaste este ${vehicleData.brand} ${vehicleData.model} hace ${daysSinceLastUpdate} días. Para republicarlo necesitas 1 crédito.`,
                        requiresCredit: true,
                        previousVehicleId: existingVehicle.id
                    });
                }

                // Si está actualmente ACTIVO, redirigirlo a su publicación existente
                if (existingVehicle.status === 'ACTIVE') {
                    return NextResponse.json({
                        action: 'REDIRECT',
                        isFraud: true,
                        score: similarityScore,
                        redirectTo: `/vehicle/${existingVehicle.id}`,
                        message: `Ya tienes este vehículo publicado actualmente.`
                    });
                }
            }
        }

        // 5. Verificar si es un SEGUNDO vehículo IDÉNTICO (política: siempre cobra)
        // Ejemplo: alguien tiene 2 Civic 2020 rojos idénticos
        if (activeVehiclesCount >= 1) {
            const identicalActiveVehicle = await prisma.vehicle.findFirst({
                where: {
                    userId: session.user.id,
                    brand: vehicleData.brand,
                    model: vehicleData.model,
                    year: vehicleData.year,
                    status: 'ACTIVE'
                }
            });

            if (identicalActiveVehicle) {
                console.log(`💰 SEGUNDO VEHÍCULO IDÉNTICO - Requiere crédito`);
                return NextResponse.json({
                    action: 'REQUIRE_CREDIT',
                    isFraud: false,
                    score: 100,
                    message: `Ya tienes un ${vehicleData.brand} ${vehicleData.model} ${vehicleData.year} activo. Publicar otro vehículo idéntico requiere 1 crédito.`,
                    requiresCredit: true
                });
            }
        }

        // 6. TODO: Buscar publicaciones similares de OTROS usuarios (fraude cruzado)
        // Por ahora, permitir la publicación

        console.log('✅ Publicación aprobada - Sin fraude detectado');

        return NextResponse.json({
            isFraud: false,
            score: 0,
            action: 'ALLOW'
        });

    } catch (error) {
        console.error('❌ Error in fraud check:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Helper: Calcular distancia entre coordenadas (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}
