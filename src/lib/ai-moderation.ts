import { prisma } from '@/lib/db'
import { analyzeMultipleImages } from './ai/imageAnalyzer'
import { generateVehicleHash } from './validateFingerprint'
import { fetchImageAsBase64 } from './ai-moderation-helper'

/**
 * 🧹 Limpieza de datos IA (Evitar "N/A")
 */
const sanitizeAIValue = (val: any) => {
    if (val === null || val === undefined) return null;
    if (typeof val !== 'string') return val;
    const clean = val.trim().toUpperCase();
    if (clean === 'N/A' || clean === 'UNKNOWN' || clean === 'DESCONOCIDO' || clean === 'NULL' || clean === '') return null;
    return val;
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
    let autoCorrected = false
    let correctedFields: string[] = []

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
    })

    if (!vehicle) return { status: 'ERROR', reason: 'Vehículo no encontrado' }

    // 🧹 Limpieza de datos IA (Evitar "N/A")
    const sanitizeAIValue = (val: any) => {
        if (!val || typeof val !== 'string') return val;
        const clean = val.trim().toUpperCase();
        if (clean === 'N/A' || clean === 'UNKNOWN' || clean === 'DESCONOCIDO' || clean === 'NULL') return null;
        return val;
    }

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
            const analysis = await analyzeMultipleImages(
                base64Images,
                'VEHICLE',
                {
                    brand: vehicle.brand,
                    model: vehicle.model,
                    year: vehicle.year.toString()
                }
            )
            const invalidIndices = analysis.invalidIndices || []

            // ═══ REGLAS DE NEGOCIO SOLICITADAS ═══

            // A) LA PORTADA ES EL LÍDER (REGLA RUBEN)
            // Si la portada no es válida o no es un vehículo motorizado terrestre, se rechaza todo.
            if (!analysis.valid || invalidIndices.includes(0)) {
                status = 'REJECTED'
                reason = analysis.reason || 'La foto de portada no es válida. Debe ser una foto clara de un vehículo motorizado terrestre.'
                console.log(`🚨 RECHAZO: Portada inválida en ${vehicleId}: ${reason}`)
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
                        // 🚀 LÓGICA DE DISCRIMINACIÓN:
                        // SI se filtraron algunas fotos -> Es una galería mezclada o con fotos inválidas. RECHAZAR.
                        if (finalImages.length < imageUrls.length) {
                            status = 'REJECTED'
                            reason = 'Se detectaron fotos de vehículos diferentes o imágenes que no cumplen las reglas. Para una base de datos limpia y verídica, cada anuncio debe ser individual.'
                            console.log(`⚠️ RECHAZO por inconsistencia/mezcla en ${vehicleId}: ${imageUrls.length - finalImages.length} fotos eliminadas.`);
                        } else {
                            // SI todas las fotos son consistentes entre sí pero diferentes al texto -> AUTO-CORREGIR.
                            status = 'APPROVED'

                            // 🚀 AUTO-CORRECCIÓN AGRESIVA (REGLA RUBEN: LA AI MANDA)
                            if (analysis.details) {
                                const details = analysis.details;
                                const updateData: any = {};

                                const aiBrand = sanitizeAIValue(details.brand);
                                const aiModel = sanitizeAIValue(details.model);
                                const aiColor = sanitizeAIValue(details.color);
                                const aiType = sanitizeAIValue(details.type);

                                // Comparamos lo que vio la AI con lo que hay en DB
                                // Si hay una diferencia clara en marca, modelo o año, LA AI GANA
                                if (aiBrand && aiBrand !== vehicle.brand) {
                                    updateData.brand = aiBrand;
                                    correctedFields.push('marca');
                                }
                                if (aiModel && aiModel !== vehicle.model) {
                                    updateData.model = aiModel;
                                    correctedFields.push('modelo');
                                }
                                const aiYearStr = sanitizeAIValue(details.year);
                                if (aiYearStr && parseInt(aiYearStr as string) !== vehicle.year) {
                                    // Solo corregir el año si hay una diferencia notable (>1 año) para evitar falsos positivos
                                    const aiYear = parseInt(aiYearStr as string);
                                    if (Math.abs(aiYear - vehicle.year) > 1) {
                                        updateData.year = aiYear;
                                        correctedFields.push('año');
                                    }
                                }
                                if (aiColor && aiColor !== vehicle.color && (vehicle.color === 'N/A' || !vehicle.color)) {
                                    updateData.color = aiColor;
                                    correctedFields.push('color');
                                }
                                if (aiType && aiType !== (vehicle as any).vehicleType) {
                                    updateData.vehicleType = aiType;
                                    correctedFields.push('tipo');
                                }

                                // 🔄 RE-SINCRONIZAR TÍTULO: Si cambió marca, modelo o año, el título debe actualizarse
                                if (updateData.brand || updateData.model || updateData.year) {
                                    const nextBrand = updateData.brand || vehicle.brand;
                                    const nextModel = updateData.model || vehicle.model;
                                    const nextYear = updateData.year !== undefined ? updateData.year : vehicle.year;
                                    updateData.title = `${nextBrand} ${nextModel} ${nextYear}`;
                                }

                                // 🧠 ENRIQUECIMIENTO: Auto-completar datos técnicos si faltan
                                // Solo llenamos si el vehículo NO tiene el dato (para respetar lo que puso el usuario si ya especificó algo)
                                // O si queremos forzar la verdad de la IA, pero por seguridad, mejor solo llenar vacíos o diferencias obvias.
                                // En este caso, como es moderación inicial, vamos a enriquecer agresivamente si la IA está segura.

                                const v = vehicle as any;
                                const aiTrans = sanitizeAIValue(details.transmission);
                                const aiFuel = sanitizeAIValue(details.fuel);
                                const aiEngine = sanitizeAIValue(details.engine);
                                const aiTract = sanitizeAIValue(details.traction);
                                const aiDoors = sanitizeAIValue(details.doors);

                                if (aiTrans && (!v.transmission || v.transmission === 'N/A')) {
                                    updateData.transmission = aiTrans;
                                    correctedFields.push('transmisión');
                                }
                                if (aiFuel && (!v.fuel || v.fuel === 'N/A')) {
                                    updateData.fuel = aiFuel;
                                    correctedFields.push('combustible');
                                }
                                if (aiEngine && (!v.engine || v.engine === 'N/A')) {
                                    updateData.engine = aiEngine;
                                    correctedFields.push('motor');
                                }
                                if (aiTract && (!v.traction || v.traction === 'N/A')) {
                                    updateData.traction = aiTract;
                                }
                                if (aiDoors && (!v.doors || v.doors === 0)) {
                                    updateData.doors = aiDoors;
                                }

                                if (Object.keys(updateData).length > 0) {
                                    autoCorrected = true;
                                    await prisma.vehicle.update({
                                        where: { id: vehicleId },
                                        data: updateData
                                    });
                                    console.log(`✨ AUTO-CORRECCIÓN disparada para ${vehicleId}: ${correctedFields.join(', ')}`);
                                }
                            }
                        }
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
            moderationFeedback: reason || (autoCorrected ? `Auto-corregido: ${correctedFields.join(', ')}` : null),
            images: finalImages,
            // BLINDAJE: Solo activar si fue aprobado y NO es marcado como vendido
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
            // Notificar al usuario con un mensaje educativo y la opción de pago
            if (status === 'REJECTED') {
                const eduMessage = isDuplicate
                    ? 'Se detectó que este vehículo ya está en la red. Mantener datos únicos ayuda a los compradores a encontrarte más rápido. Puedes activarlo con 1 crédito.'
                    : `${reason} Recuerda que entre más reales sean tus datos, más confianza generarás en tus compradores. Puedes corregirlo o activarlo con 1 crédito.`;

                await prisma.notification.create({
                    data: {
                        userId: fullVehicle.userId,
                        type: 'SYSTEM',
                        title: isDuplicate ? '🛡️ CarMatch: Aviso de Duplicado' : '⚠️ CarMatch: Revisión de Calidad',
                        message: eduMessage,
                        link: `/profile?tab=vehicles`,
                        metadata: JSON.stringify({ vehicleId, reason, status, isDuplicate })
                    }
                })
            } else if (autoCorrected) {
                // Notificación de éxito con auto-corrección
                await prisma.notification.create({
                    data: {
                        userId: fullVehicle.userId,
                        type: 'SYSTEM',
                        title: '✨ CarMatch: Publicación Optimizada',
                        message: `¡Buenas noticias! Hemos ajustado automáticamente la ${correctedFields.join(', ')} de tu anuncio para que coincida con tus fotos. Esto ayudará a que más compradores reales te encuentren fácilmente.`,
                        link: `/profile?tab=vehicles`,
                        metadata: JSON.stringify({ vehicleId, status, autoCorrected, correctedFields })
                    }
                })
            }

            // 🚗 LIMPIEZA SILENCIOSA: Si se eliminaron fotos por ser de un vehículo DIFERENTE, no avisamos al usuario.
            // Se darán cuenta solos de que la plataforma es seria y solo acepta anuncios individuales.
            if (status === 'APPROVED' && finalImages.length < imageUrls.length) {
                const removedCount = imageUrls.length - finalImages.length;
                console.log(`ℹ️ Filtrado SILENCIOSO de vehículos mezclados: Se eliminaron ${removedCount} fotos de ${vehicleId}`);
            }
        }
    } catch (notifError) {
        console.error('Error enviando notificación:', notifError)
    }

    console.log(`🛡️ Seguridad CarMatch: Revisión finalizada para ${vehicleId} -> ${status} (${finalImages.length} fotos finales)`)
    return { status, reason }
}

/**
 * 🤖 ASESOR REAL: Función para corregir y aprobar automáticamente un vehículo
 * Basado en el análisis previo de la IA.
 */
export async function fixAndApproveVehicle(vehicleId: string) {
    console.log(`✨ Asesor Real: Iniciando corrección asistida para vehículo ${vehicleId}`)

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
    })

    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' }

    if (!vehicle.images || vehicle.images.length === 0) {
        return { success: false, error: 'El vehículo no tiene imágenes para analizar' }
    }

    try {
        // 1. Re-analizar imágenes para obtener los mejores datos posibles
        const base64Images = (await Promise.all(
            vehicle.images.slice(0, 3).map(url => fetchImageAsBase64(url))
        )).filter((img): img is string => img !== null)

        if (base64Images.length === 0) {
            return { success: false, error: 'No se pudieron procesar las imágenes actuales.' }
        }

        const analysis = await analyzeMultipleImages(base64Images, 'VEHICLE')

        if (!analysis.valid) {
            return { success: false, error: analysis.reason || 'Las imágenes no son válidas para un vehículo.' }
        }

        const details = analysis.details
        if (!details) {
            return { success: false, error: 'La IA no pudo extraer detalles suficientes.' }
        }

        // 2. Aplicar correcciones AGRESIVAS para Identidad (La Portada manda)
        const updateData: any = {
            moderationStatus: 'APPROVED',
            status: 'ACTIVE'
        }

        const isVal = (v: any) => v && v !== 'N/A' && v !== 0

        const aiBrand = sanitizeAIValue(details.brand);
        const aiModel = sanitizeAIValue(details.model);
        const aiYearStr = sanitizeAIValue(details.year);
        const aiColor = sanitizeAIValue(details.color);
        const aiType = sanitizeAIValue(details.type);

        // Identidad (Soberana de la Portada)
        if (aiBrand && aiBrand !== vehicle.brand) {
            updateData.brand = aiBrand
        }
        if (aiModel && aiModel !== vehicle.model) {
            updateData.model = aiModel
        }
        if (aiYearStr && parseInt(aiYearStr as string) !== vehicle.year) {
            const aiYear = parseInt(aiYearStr as string)
            if (Math.abs(aiYear - vehicle.year) > 1) {
                updateData.year = aiYear
            }
        }
        if (!isVal(vehicle.color) && aiColor) updateData.color = aiColor
        if (aiType && aiType !== (vehicle as any).vehicleType) {
            updateData.vehicleType = aiType
        }

        // 🧠 ENRIQUECIMIENTO TÉCNICO (Solo si el usuario no proporcionó el dato)
        const aiTrans = sanitizeAIValue(details.transmission);
        const aiFuel = sanitizeAIValue(details.fuel);
        const aiEngine = sanitizeAIValue(details.engine);
        const aiTract = sanitizeAIValue(details.traction);
        const aiCondition = sanitizeAIValue(details.condition);

        if (!isVal(vehicle.transmission) && aiTrans)
            updateData.transmission = aiTrans

        if (!isVal(vehicle.fuel) && aiFuel)
            updateData.fuel = aiFuel

        if (!isVal(vehicle.engine) && aiEngine)
            updateData.engine = aiEngine

        if (!isVal(vehicle.traction) && aiTract)
            updateData.traction = aiTract

        if (!vehicle.doors && details.doors) updateData.doors = sanitizeAIValue(details.doors)
        if (!vehicle.condition && aiCondition) updateData.condition = aiCondition
        if (!vehicle.displacement && details.displacement) updateData.displacement = details.displacement
        if (!vehicle.cargoCapacity && details.cargoCapacity) updateData.cargoCapacity = details.cargoCapacity

        // Nuevos campos técnicos CarMatch
        if (!vehicle.hp && details.hp !== undefined) updateData.hp = details.hp
        if (!vehicle.torque && details.torque !== undefined) updateData.torque = details.torque
        if (!vehicle.aspiration && details.aspiration !== undefined) updateData.aspiration = details.aspiration
        if (!vehicle.cylinders && details.cylinders !== undefined) updateData.cylinders = details.cylinders
        if (!vehicle.batteryCapacity && details.batteryCapacity !== undefined) updateData.batteryCapacity = details.batteryCapacity
        if (!vehicle.range && details.range !== undefined) updateData.range = details.range
        if (!vehicle.weight && details.weight !== undefined) updateData.weight = details.weight
        if (!vehicle.axles && details.axles !== undefined) updateData.axles = details.axles
        if (!vehicle.operatingHours && details.operatingHours) updateData.operatingHours = details.operatingHours

        // Generar nuevo título basado en la corrección
        updateData.title = `${updateData.brand || vehicle.brand} ${updateData.model || vehicle.model} ${updateData.year || vehicle.year}`

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                ...updateData,
                moderationFeedback: '✅ Corregido y activado por el Asesor Real.'
            }
        })

        // 3. Notificación "Asesor Real"
        await prisma.notification.create({
            data: {
                userId: vehicle.userId,
                type: 'SYSTEM',
                title: '✅ Asesor Real: Publicación Activada',
                message: `¡Hola! He revisado tu anuncio personalmente. He corregido los datos para que coincidan exactamente con tus fotos y ya está activo en CarMatch y MarketCar. ¡Mucha suerte con tu venta!`,
                link: `/profile?tab=vehicles`,
                metadata: JSON.stringify({ vehicleId, status: 'APPROVED' })
            }
        })

        return { success: true }

    } catch (error) {
        console.error('❌ Error en Asesor Real IA:', error)
        return { success: false, error: 'Fallo técnico al procesar el Asesor Real' }
    }
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
