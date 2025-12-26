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
}) {
    const str = `${data.brand}-${data.model}-${data.year}-${data.color || ''}`.toLowerCase().replace(/\s/g, '')
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
    // 1. Buscar publicaciones similares del mismo usuario
    const recentPublications = await prisma.publicationFingerprint.findMany({
        where: {
            userId: params.userId,
            publicationType: params.publicationType,
            createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    if (recentPublications.length === 0) {
        return { isFraud: false, reason: 'Primera publicación' }
    }

    // 2. Para NEGOCIOS: GPS cerca es fraude directo
    if (params.publicationType === 'BUSINESS') {
        for (const pub of recentPublications) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            if (distance < 50) {
                return {
                    isFraud: true,
                    reason: 'Negocio duplicado en misma ubicación',
                    distance
                }
            }
        }
    }

    // 3. Para VEHÍCULOS: Validación inteligente (mismo vehículo físico)
    if (params.publicationType === 'VEHICLE' && params.images && params.description) {
        for (const pub of recentPublications) {
            const distance = calculateGPSDistance(
                params.latitude,
                params.longitude,
                pub.latitude,
                pub.longitude
            )

            // Solo validar si está en zona cercana (< 100m)
            if (distance < 100) {
                // Aquí conectarías con la publicación original para comparar
                // Por ahora, validamos solo GPS + IP + Device
                if (pub.ipAddress === params.ipAddress && pub.deviceHash === params.deviceHash) {
                    return {
                        isFraud: true,
                        reason: 'Mismo dispositivo e IP en ubicación cercana',
                        distance,
                        suspicionLevel: 'high'
                    }
                }
            }
        }
    }

    // 4. Validar IP/Device duplicados en corto tiempo
    const sameDeviceRecent = recentPublications.find(pub =>
        pub.deviceHash === params.deviceHash &&
        pub.ipAddress === params.ipAddress &&
        new Date(pub.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 días
    )

    if (sameDeviceRecent) {
        return {
            isFraud: true,
            reason: 'Múltiples publicaciones desde mismo dispositivo en 7 días',
            suspicionLevel: 'medium'
        }
    }

    return { isFraud: false, reason: 'Publicación legítima' }
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


