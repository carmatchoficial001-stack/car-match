import crypto from 'crypto'
import { prisma } from './db'
import { calculateGPSDistance, compareImageHashes, compareWritingStyle } from './fingerprint'
// ... (rest of imports)

// ...

export function generateVehicleHash(data: {
    brand: string
    model: string
    year: number
    color?: string | null
    vehicleType?: string | null
    engine?: string | null
    transmission?: string | null
}) {
    // Hash técnico robusto: combina marca, modelo, año, color, tipo, motor y transmisión
    // Si el usuario cambia el título, el hash técnico lo sigue reconociendo como el mismo objeto físico.
    const str = [
        data.brand,
        data.model,
        data.year,
        data.color,
        data.vehicleType,
        data.engine,
        data.transmission
    ].map(v => String(v || '').toLowerCase().replace(/\s/g, '')).join('-')

    return crypto.createHash('sha256').update(str).digest('hex')
}

/**
 * Validar si una publicación es fraudulenta (duplicado)
 * Si detecta fraude → NO dar tiempo gratis, cobrar desde el inicio
 */
export async function validatePublicationFingerprint(params: {
    userId: string
    publicationType: 'VEHICLE' | 'BUSINESS'
    latitude: number
    longitude: number
    deviceHash: string
    ipAddress: string

    // Datos para detectar vehículos duplicados
    images?: string[]
    description?: string
    price?: number
}) {
    // ⚔️ SEGURIDAD RADICAL: Buscamos si el DISPOSITIVO ya se usó con OTRA cuenta
    // Si un mismo celular/navegador tiene 2+ cuentas, BLOQUER beneficios gratis.
    const deviceHistory = await prisma.publicationFingerprint.findMany({
        where: {
            deviceHash: params.deviceHash,
            createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 días de historial
            }
        },
        select: { userId: true, publicationType: true, latitude: true, longitude: true, ipAddress: true }
    })

    if (deviceHistory.length > 0) {
        // Identificar si hay otras cuentas vinculadas a este dispositivo
        const otherUsers = Array.from(new Set(deviceHistory.map(h => h.userId).filter(id => id !== params.userId)))

        // LÍMITE DE MULTICUENTA: 3 Cuentas por dispositivo.
        // Si hay 2 o más usuarios DIFERENTES previos, este sería el 3ro (o más), así que se bloquea.
        if (otherUsers.length >= 2) {
            console.log(`🛡️ SEGURIDAD: Límite de cuentas excedido en disposito ${params.deviceHash}. Cuentas previas: [${otherUsers.join(', ')}]`)
            return {
                isFraud: true,
                reason: `🛡️ LÍMITE DISPOSITIVO: Se han detectado demasiadas cuentas (${otherUsers.length + 1}) en este dispositivo. El límite son 3 cuentas con beneficios gratuitos.`
            }
        }
    }

    // 1. Para NEGOCIOS: GPS cerca es sospechoso
    if (params.publicationType === 'BUSINESS') {
        const nearBusinesses = deviceHistory.filter(h => h.publicationType === 'BUSINESS')
        for (const pub of nearBusinesses) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            if (distance < 300) { // Radio de 300m
                return {
                    isFraud: true,
                    reason: 'Este negocio o uno muy similar ya fue registrado desde este dispositivo en esta zona.',
                    distance
                }
            }
        }
    }

    // 2. Para VEHÍCULOS: Límite por dispositivo
    if (params.publicationType === 'VEHICLE') {
        const deviceVehicleCount = deviceHistory.filter(h => h.publicationType === 'VEHICLE').length

        // Si el usuario ha publicado más de 5 vehículos desde este mismo dispositivo
        // es un lote o un revendedor, ya no es "usuario casual", debe pagar.
        if (deviceVehicleCount >= 5) {
            return {
                isFraud: true, // Lo tratamos como "fraude de beneficios" (querer todo gratis)
                reason: 'Has alcanzado el límite de publicaciones gratuitas permitidas para este dispositivo. Las siguientes requieren activación.'
            }
        }

        // Validación por proximidad para evitar SPAM del mismo carro
        for (const pub of deviceHistory.filter(h => h.publicationType === 'VEHICLE')) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            if (distance < 100) { // Misma ubicación física exacta
                // Podría ser el mismo carro resubido
                // check global history for this user too (already done in route.ts)
            }
        }
    }

    // 3. Validar IP duplicada masivamente
    const ipHistoryCount = deviceHistory.filter(pub => pub.ipAddress === params.ipAddress).length
    if (ipHistoryCount > 10) {
        return {
            isFraud: true,
            reason: 'Actividad excesiva detectada desde esta conexión de red.'
        }
    }

    return { isFraud: false, reason: 'Huella validada' }
}

/**
 * Guardar huella después de crear publicación
 */
export async function savePublicationFingerprint(data: {
    userId: string
    publicationType: 'VEHICLE' | 'BUSINESS'
    publicationId: string
    latitude: number
    longitude: number
    ipAddress: string
    deviceHash: string
    userAgent?: string
}) {
    return await prisma.publicationFingerprint.create({
        data: {
            userId: data.userId,
            publicationType: data.publicationType,
            publicationId: data.publicationId,
            latitude: data.latitude,
            longitude: data.longitude,
            ipAddress: data.ipAddress,
            deviceHash: data.deviceHash,
            userAgent: data.userAgent || ''
        }
    })
}


