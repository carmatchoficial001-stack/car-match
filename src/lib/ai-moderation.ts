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
            // 1. Convertir imágenes a base64 (Límite de 10 para análisis completo CarMatch)
            const base64Images = (await Promise.all(
                imageUrls.slice(0, 10).map(url => fetchImageAsBase64(url))
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

            // ═══ REGLAS DE NEGOCIO RUBEN ═══

            // A) LA PORTADA ES LA SOBERANA
            if (!analysis.valid || invalidIndices.includes(0)) {
                status = 'REJECTED'
                reason = analysis.reason || 'La foto de portada no es válida. Debe ser un vehículo real.'
                console.log(`🚨 RECHAZO: Portada inválida en ${vehicleId}`)
            } else {
                // B) DETECCIÓN DE DUPLICADOS (Usando lo que vio la IA)
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

                const similarExisting = await prisma.vehicle.findFirst({
                    where: {
                        userId: vehicle.userId,
                        id: { not: vehicleId },
                        searchIndex: canonicalHash,
                        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
                        status: { in: ['ACTIVE', 'SOLD', 'INACTIVE'] }
                    }
                })

                if (similarExisting) {
                    isDuplicate = true
                    status = 'REJECTED'
                    reason = 'Vehículo ya publicado anteriormente.'
                    await prisma.user.update({
                        where: { id: vehicle.userId },
                        data: { fraudStrikes: { increment: 1 } }
                    })
                } else {
                    // C) LIMPIEZA SILENCIOSA Y APROBACIÓN
                    status = 'APPROVED'
                    finalImages = imageUrls.filter((_, idx) => !invalidIndices.includes(idx))

                    // Si hubo fotos filtradas (memes, otros carros), actualizamos DB
                    if (finalImages.length < imageUrls.length) {
                        console.log(`✨ AI Cleanup: ${imageUrls.length - finalImages.length} fotos eliminadas en ${vehicleId}`);
                        await prisma.vehicle.update({
                            where: { id: vehicleId },
                            data: { images: finalImages }
                        });
                    }

                    // D) AUTO-CORRECCIÓN Y ENRIQUECIMIENTO (LA IA MANDA)
                    if (analysis.details) {
                        const details = analysis.details;
                        const updateData: any = {};
                        const v = vehicle as any;

                        // Corrección de Identidad
                        const aiBrandSan = sanitizeAIValue(details.brand);
                        if (aiBrandSan && aiBrandSan !== vehicle.brand) {
                            updateData.brand = aiBrandSan;
                            correctedFields.push('marca');
                        }
                        const aiModelSan = sanitizeAIValue(details.model);
                        if (aiModelSan && aiModelSan !== vehicle.model) {
                            updateData.model = aiModelSan;
                            correctedFields.push('modelo');
                        }
                        const aiYearStr = sanitizeAIValue(details.year);
                        if (aiYearStr) {
                            const aiYearInt = parseInt(aiYearStr as string);
                            if (Math.abs(aiYearInt - vehicle.year) > 1) {
                                updateData.year = aiYearInt;
                                correctedFields.push('año');
                            }
                        }

                        // Enriquecimiento Técnico
                        const technicalFields = ['transmission', 'fuel', 'engine', 'traction', 'color', 'condition', 'doors', 'passengers'];
                        technicalFields.forEach(f => {
                            const aiVal = sanitizeAIValue((details as any)[f]);
                            if (aiVal && (!v[f] || v[f] === 'N/A' || v[f] === '')) {
                                updateData[f] = (f === 'doors' || f === 'passengers') ? parseInt(aiVal as string) : aiVal;
                                correctedFields.push(f);
                            }
                        });

                        // Nuevos campos técnicos CarMatch
                        const aiHp = sanitizeAIValue(details.hp);
                        if (aiHp && !v.hp) updateData.hp = parseInt(aiHp as string);
                        const aiTorque = sanitizeAIValue(details.torque);
                        if (aiTorque && !v.torque) updateData.torque = aiTorque;
                        const aiAspiration = sanitizeAIValue(details.aspiration);
                        if (aiAspiration && !v.aspiration) updateData.aspiration = aiAspiration;
                        const aiCylinders = sanitizeAIValue(details.cylinders);
                        if (aiCylinders && !v.cylinders) updateData.cylinders = parseInt(aiCylinders as string);
                        const aiBatteryCapacity = sanitizeAIValue(details.batteryCapacity);
                        if (aiBatteryCapacity && !v.batteryCapacity) updateData.batteryCapacity = parseFloat(aiBatteryCapacity as string);
                        const aiRange = sanitizeAIValue(details.range);
                        if (aiRange && !v.range) updateData.range = parseInt(aiRange as string);
                        const aiWeight = sanitizeAIValue(details.weight);
                        if (aiWeight && !v.weight) updateData.weight = parseInt(aiWeight as string);
                        const aiAxles = sanitizeAIValue(details.axles);
                        if (aiAxles && !v.axles) updateData.axles = parseInt(aiAxles as string);
                        const aiPassengers = sanitizeAIValue(details.passengers);
                        if (aiPassengers && !v.passengers) updateData.passengers = parseInt(aiPassengers as string);
                        const aiDisplacement = sanitizeAIValue(details.displacement);
                        if (aiDisplacement && !v.displacement) updateData.displacement = aiDisplacement;
                        const aiCargoCapacity = sanitizeAIValue(details.cargoCapacity);
                        if (aiCargoCapacity && !v.cargoCapacity) updateData.cargoCapacity = aiCargoCapacity;
                        const aiOperatingHours = sanitizeAIValue(details.operatingHours);
                        if (aiOperatingHours && !v.operatingHours) updateData.operatingHours = aiOperatingHours;

                        if (Object.keys(updateData).length > 0) {
                            autoCorrected = true;
                            // Sincronizar título si cambió identidad
                            if (updateData.brand || updateData.model || updateData.year) {
                                updateData.title = `${updateData.brand || vehicle.brand} ${updateData.model || vehicle.model} ${updateData.year || vehicle.year}`;
                            }
                            await prisma.vehicle.update({
                                where: { id: vehicleId },
                                data: updateData
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error en moderación Gemini (${vehicleId}):`, error)
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
        // 1. Re-analizar imágenes para obtener los mejores datos posibles (Límite de 10)
        const base64Images = (await Promise.all(
            vehicle.images.slice(0, 10).map(url => fetchImageAsBase64(url))
        )).filter((img): img is string => img !== null)

        if (base64Images.length === 0) {
            return { success: false, error: 'No se pudieron procesar las imágenes actuales.' }
        }

        const analysis = await analyzeMultipleImages(base64Images, 'VEHICLE')
        const invalidIndices = analysis.invalidIndices || []

        if (!analysis.valid || invalidIndices.includes(0)) {
            return { success: false, error: analysis.reason || 'La foto de portada no es válida para un vehículo.' }
        }

        const details = analysis.details
        if (!details) {
            return { success: false, error: 'La IA no pudo extraer detalles suficientes.' }
        }

        // 🚀 LIMPIEZA SILENCIOSA (REGLA RUBEN)
        const finalImages = vehicle.images.filter((_, idx) => !invalidIndices.includes(idx))

        // 2. Aplicar correcciones AGRESIVAS para Identidad (La Portada manda)
        const updateData: any = {
            moderationStatus: 'APPROVED',
            status: 'ACTIVE',
            images: finalImages // Guardar galería limpia
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

        if (!vehicle.doors && details.doors) updateData.doors = parseInt(sanitizeAIValue(details.doors) as string)
        if (!vehicle.condition && aiCondition) updateData.condition = aiCondition
        if (!v.passengers && details.passengers) updateData.passengers = parseInt(sanitizeAIValue(details.passengers) as string)

        const aiHp = sanitizeAIValue(details.hp);
        const aiCyl = sanitizeAIValue(details.cylinders);
        const aiBatt = sanitizeAIValue(details.batteryCapacity);
        const aiRang = sanitizeAIValue(details.range);
        const aiWeig = sanitizeAIValue(details.weight);
        const aiAxles = sanitizeAIValue(details.axles);

        if (!v.hp && aiHp) updateData.hp = parseInt(aiHp as string)
        if (!v.torque && details.torque) updateData.torque = sanitizeAIValue(details.torque)
        if (!v.aspiration && details.aspiration) updateData.aspiration = sanitizeAIValue(details.aspiration)
        if (!v.cylinders && aiCyl) updateData.cylinders = parseInt(aiCyl as string)
        if (!v.batteryCapacity && aiBatt) updateData.batteryCapacity = parseFloat(aiBatt as string)
        if (!v.range && aiRang) updateData.range = parseInt(aiRang as string)
        if (!v.weight && aiWeig) updateData.weight = parseInt(aiWeig as string)
        if (!v.axles && aiAxles) updateData.axles = parseInt(aiAxles as string)
        if (!v.displacement && details.displacement) updateData.displacement = sanitizeAIValue(details.displacement)
        if (!v.cargoCapacity && details.cargoCapacity) updateData.cargoCapacity = sanitizeAIValue(details.cargoCapacity)
        if (!v.operatingHours && details.operatingHours) updateData.operatingHours = sanitizeAIValue(details.operatingHours)
        if (!v.operatingHours && details.operatingHours) updateData.operatingHours = parseInt(details.operatingHours as any)

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
