import { prisma } from '@/lib/db'
import { analyzeMultipleImages } from './ai/imageAnalyzer'
import { generateVehicleHash } from './validateFingerprint'

/**
 * Helper para convertir URLs de imágenes (Cloudinary) a Base64
 * para que Gemini las pueda procesar.
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Falló descarga: ${response.statusText}`)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return buffer.toString('base64')
    } catch (error) {
        console.error(`❌ Error convirtiendo imagen a base64 (${url}):`, error)
        return null
    }
}

/**
 * Servicio de Moderación Automática (AI) Real con Gemini
 */
export async function moderateVehicleListing(vehicleId: string, imageUrls: string[]) {
    console.log(`🛡️ Seguridad CarMatch: Iniciando revisión REAL con Gemini para vehículo ${vehicleId}`)

    let status: 'APPROVED' | 'REJECTED' = 'APPROVED'
    let reason = ''
    let finalImages = [...imageUrls]
    let isDuplicate = false

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
    })

    if (!vehicle) return { status: 'ERROR', reason: 'Vehículo no encontrado' }

    if (!imageUrls || imageUrls.length === 0) {
        status = 'REJECTED'
        reason = 'No se detectaron imágenes del vehículo.'
    } else {
        try {
            // 1. Convertir imágenes a base64 (Límite de 5 para no saturar análisis inteligente inicial)
            const base64Images = (await Promise.all(
                imageUrls.slice(0, 5).map(url => fetchImageAsBase64(url))
            )).filter((img): img is string => img !== null)

            if (base64Images.length === 0) {
                console.warn(`⚠️ No se pudieron procesar las imágenes de ${vehicleId}. Pasando a revisión manual.`)
                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: { moderationStatus: 'MANUAL_REVIEW' }
                })
                return { status: 'PENDING', reason: 'Fallo técnico en análisis' }
            }

            // 2. Llamar a la IA Real (Gemini 1.5 Flash)
            const analysis = await analyzeMultipleImages(base64Images, 'VEHICLE')
            const invalidIndices = analysis.invalidIndices || []

            // ═══ REGLAS DE NEGOCIO SOLICITADAS ═══

            // A) LA PORTADA ES SAGRADA (Índice 0)
            if (invalidIndices.includes(0)) {
                status = 'REJECTED'
                reason = `La foto de portada no es válida: ${analysis.reason || 'Debe ser una foto clara de un vehículo motorizado.'}`
                console.log(`🚨 RECHAZO: Foto de portada inválida en ${vehicleId}`)
            }
            // B) DETECCIÓN DE DUPLICADOS POR IA (Anti-Fraude)
            else {
                // Usamos los datos reales que vio la IA para generar una huella del carro
                const aiDetails = analysis.details || {}
                const aiBrand = aiDetails.brand || vehicle.brand
                const aiModel = aiDetails.model || vehicle.model
                const aiYear = aiDetails.year ? parseInt(aiDetails.year) : vehicle.year

                const canonicalHash = generateVehicleHash({
                    brand: aiBrand,
                    model: aiModel,
                    year: aiYear,
                    color: aiDetails.color || vehicle.color,
                    vehicleType: aiDetails.type || (vehicle as any).vehicleType,
                    transmission: aiDetails.transmission || (vehicle as any).transmission,
                    engine: aiDetails.engine || (vehicle as any).engine
                })

                // Buscar si este mismo usuario ya publicó este carmóvil recientemente
                const similarExisting = await prisma.vehicle.findFirst({
                    where: {
                        userId: vehicle.userId,
                        id: { not: vehicleId },
                        searchIndex: canonicalHash, // El hash verificado por IA
                        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // Últimos 60 días
                        status: { in: ['ACTIVE', 'SOLD', 'INACTIVE'] }
                    }
                })

                if (similarExisting) {
                    isDuplicate = true
                    status = 'REJECTED'
                    reason = 'Se detectó que este vehículo ya fue publicado anteriormente. Para evitar duplicados, no se permite republicar el mismo vehículo en un periodo corto.'

                    // Sancionar al usuario
                    await prisma.user.update({
                        where: { id: vehicle.userId },
                        data: { fraudStrikes: { increment: 1 } }
                    })
                } else {
                    // Filtrado silencioso para las demás
                    finalImages = imageUrls.filter((_, idx) => !invalidIndices.includes(idx))

                    if (finalImages.length === 0) {
                        status = 'REJECTED'
                        reason = 'Ninguna de las fotos subidas cumple con las políticas de vehículos.'
                    } else {
                        status = 'APPROVED'
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error en moderación Gemini (${vehicleId}):`, error)
            status = 'APPROVED'
        }
    }

    // Actualizar estado en DB (con las fotos filtradas si aplica)
    await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
            moderationStatus: status,
            images: finalImages, // Guardamos solo las fotos que pasaron la prueba
            status: status === 'REJECTED' ? 'INACTIVE' : 'ACTIVE'
        }
    })

    // Notificar al usuario solo si hubo cambios importantes o rechazo
    try {
        const fullVehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { userId: true, brand: true, model: true }
        })

        if (fullVehicle) {
            // Solo notificamos si fue rechazado. 
            if (status === 'REJECTED') {
                await prisma.notification.create({
                    data: {
                        userId: fullVehicle.userId,
                        type: 'SYSTEM',
                        title: isDuplicate ? '🛡️ Seguridad: Vehículo Duplicado' : '⚠️ Acción Requerida: Publicidación Bloqueada',
                        message: reason,
                        link: `/profile?tab=vehicles`,
                        metadata: JSON.stringify({ vehicleId, reason, status, isDuplicate })
                    }
                })
            } else if (finalImages.length < imageUrls.length) {
                console.log(`ℹ️ Filtrado silencioso: Se eliminaron ${imageUrls.length - finalImages.length} fotos inválidas de ${vehicleId}`)
            }
        }
    } catch (notifError) {
        console.error('Error enviando notificación:', notifError)
    }

    console.log(`🛡️ Seguridad CarMatch: Revisión finalizada para ${vehicleId} -> ${status} (${finalImages.length} fotos finales)`)
    return { status, reason }
}

/**
 * Moderación de Negocios (Sigue el mismo patrón Real)
 */
export async function moderateBusinessListing(businessId: string, imageUrls: string[]) {
    console.log(`🛡️ Seguridad CarMatch: Iniciando revisión REAL para negocio ${businessId}`)

    // Por ahora los negocios son más flexibles, pero usamos la misma IA
    let status: 'APPROVED' | 'REJECTED' = 'APPROVED'
    let reason = ''

    if (imageUrls && imageUrls.length > 0) {
        try {
            const base64Images = (await Promise.all(
                imageUrls.slice(0, 3).map(url => fetchImageAsBase64(url))
            )).filter((img): img is string => img !== null)

            if (base64Images.length > 0) {
                const analysis = await analyzeMultipleImages(base64Images, 'BUSINESS')
                if (!analysis.valid) {
                    status = 'REJECTED'
                    reason = analysis.reason || 'Viole nuestras políticas de seguridad.'
                }
            }
        } catch (e) {
            console.error('Error moderando negocio:', e)
        }
    }

    await prisma.business.update({
        where: { id: businessId },
        data: { isActive: status === 'REJECTED' ? false : true }
    })

    // Notificación
    try {
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { userId: true, name: true }
        })

        if (business) {
            await prisma.notification.create({
                data: {
                    userId: business.userId,
                    type: 'SYSTEM',
                    title: status === 'APPROVED' ? '✅ Negocio Verificado' : '⚠️ Aviso de Seguridad',
                    message: status === 'APPROVED'
                        ? `Tu negocio "${business.name}" es visible en el mapa.`
                        : `Tu negocio ha sido pausado. Razón: ${reason}`,
                    link: `/my-businesses`,
                    metadata: JSON.stringify({ businessId, reason, status })
                }
            })
        }
    } catch (e) {
        console.error('Error notif negocio:', e)
    }

    return { status, reason }
}
