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
    // ⚔️ SEGURIDAD GLOBAL: Buscamos si el DISPOSITIVO ya se usó recientemente
    // Esto detecta fraude multi-cuenta (usuarios distintos en el mismo teléfono)
    const deviceHistory = await prisma.publicationFingerprint.findMany({
        where: {
            deviceHash: params.deviceHash,
            publicationType: params.publicationType,
            createdAt: {
                gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // Últimos 60 días
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    if (deviceHistory.length === 0) {
        return { isFraud: false, reason: 'Dispositivo limpio' }
    }

    // Identificar si hay otras cuentas vinculadas a este dispositivo
    const otherUsers = Array.from(new Set(deviceHistory.map(h => h.userId).filter(id => id !== params.userId)))
    const isMultiAccount = otherUsers.length > 0

    // 1. Para NEGOCIOS: GPS cerca es fraude directo
    if (params.publicationType === 'BUSINESS') {
        for (const pub of deviceHistory) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            if (distance < 100) { // Radio de 100m para negocios
                return {
                    isFraud: true,
                    reason: isMultiAccount
                        ? 'Detección de múltiples cuentas intentando publicar el mismo negocio'
                        : 'Este negocio ya fue registrado desde este dispositivo en esta zona.',
                    distance
                }
            }
        }
    }

    // 2. Para VEHÍCULOS: Validación por proximidad y dispositivo
    if (params.publicationType === 'VEHICLE') {
        for (const pub of deviceHistory) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            // Si es el mismo dispositivo en una zona cercana (< 1km) y ha publicado mucho
            if (distance < 1000) {
                if (deviceHistory.length >= 3 && !isMultiAccount) {
                    return {
                        isFraud: true,
                        reason: 'Límite de publicaciones gratuitas excedido para este dispositivo en esta zona.',
                        suspicionLevel: 'medium'
                    }
                }

                if (isMultiAccount) {
                    // Si hay varias cuentas en el mismo celular publicando en el mismo radio
                    return {
                        isFraud: true,
                        reason: '🛡️ Seguridad: Actividad sospechosa de múltiples cuentas. Por favor contacta a soporte.',
                        suspicionLevel: 'high'
                    }
                }
            }
        }
    }

    // 3. Validar IP duplicada masivamente
    const ipHistoryCount = deviceHistory.filter(pub => pub.ipAddress === params.ipAddress).length
    if (ipHistoryCount > 5) {
        return {
            isFraud: true,
            reason: 'Demasiadas publicaciones detectadas desde esta conexión de red.',
            suspicionLevel: 'medium'
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


