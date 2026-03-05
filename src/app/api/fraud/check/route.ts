// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

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
            useCredit
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

        // 2. Obtener datos del usuario (créditos y contador histórico)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true, lifetimeVehicleCount: true }
        });

        const activeVehiclesCount = await prisma.vehicle.count({
            where: {
                userId: session.user.id,
                status: 'ACTIVE'
            }
        });

        const lifetimeCount = user?.lifetimeVehicleCount || 0;
        const userCredits = user?.credits || 0;

        console.log(`📊 Usuario tiene ${activeVehiclesCount} activos | ${lifetimeCount} históricos | ${userCredits} créditos`);

        // 3. Buscar si este VEHÍCULO EXACTO ya fue publicado por ESTE USUARIO
        const userVehicles = await prisma.vehicle.findMany({
            where: {
                userId: session.user.id,
                brand: vehicleData.brand,
                model: vehicleData.model,
                year: vehicleData.year,
                // Excluir el vehículo actual si se está editando
                ...(body.currentVehicleId ? { id: { not: body.currentVehicleId } } : {}),
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

            console.log(`🎯 Similaridad con vehículo ${existingVehicle.id}: ${similarityScore}%`);

            // Si es MUY similar (>= 70%) y NO es una edición (ya filtrado arriba)
            if (similarityScore >= 70) {
                const daysSinceLastUpdate = Math.floor(
                    (new Date().getTime() - new Date(existingVehicle.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                console.log(`⚠️ VEHÍCULO DUPLICADO DETECTADO | Status: ${existingVehicle.status} | Hace ${daysSinceLastUpdate} días`);

                // Si está actualmente ACTIVO, probablemente es un error del usuario intentando publicar de nuevo en vez de editar
                // PERO, si el usuario insiste, le avisamos.
                if (existingVehicle.status === 'ACTIVE') {
                    return NextResponse.json({
                        action: 'REDIRECT', // Redirigir a la publicación existente para que la edite
                        isFraud: true,
                        score: similarityScore,
                        redirectTo: `/vehicle/${existingVehicle.id}`,
                        message: `Ya tienes este vehículo publicado. Te estamos redirigiendo para que puedas editarlo.`
                    });
                }
            }
        }

        // 5. Verificar límite de vehículos gratis (Primeros 25 HISTÓRICOS)
        // Usamos lifetimeCount para que borrar y resubir no resetee el beneficio
        if (lifetimeCount >= 25 && !useCredit) {
            console.log(`💰 LÍMITE GRATUITO EXCEDIDO (${lifetimeCount} históricos) - Requiere crédito`);
            return NextResponse.json({
                action: 'REQUIRE_CREDIT',
                isFraud: false,
                score: 0,
                message: userCredits > 0
                    ? `Has alcanzado el límite de 25 vehículos gratuitos. Tienes ${userCredits} créditos disponibles. ¿Deseas usar 1 para publicar?`
                    : `Has alcanzado el límite de 25 vehículos gratuitos. Para publicar más necesitas 1 crédito.`,
                requiresCredit: true,
                userCredits,
                lifetimeCount
            });
        }

        // 6. TODO: Buscar publicaciones similares de OTROS usuarios (fraude cruzado)
        // Por ahora, permitir la publicación

        console.log('✅ Publicación aprobada - Sin fraude detectado');

        return NextResponse.json({
            isFraud: false,
            score: 0,
            action: 'ALLOW',
            userCredits,
            lifetimeCount
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
