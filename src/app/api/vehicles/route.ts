import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * API endpoint para crear un nuevo vehículo
 * POST /api/vehicles
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, fraudStrikes: true, isAdmin: true, lifetimeVehicleCount: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        const body = await request.json()

        // Validar campos requeridos
        const { title, brand, model, year, price, city, latitude, longitude, description } = body

        const missingFields = []
        if (!title) missingFields.push('Título')
        if (!brand) missingFields.push('Marca')
        if (!model || model === 'N/A') missingFields.push('Modelo')
        if (!year) missingFields.push('Año')
        if (!price) missingFields.push('Precio')
        if (!city) missingFields.push('Ciudad')
        if (!body.images || body.images.length === 0) missingFields.push('Imágenes')

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: 'Faltan campos requeridos',
                    missingFields
                },
                { status: 400 }
            )
        }

        // Validar valores lógicos (No negativos)
        if (parseFloat(price) < 0 || parseInt(year) < 1900) {
            return NextResponse.json(
                { error: 'El precio y el año deben ser valores válidos' },
                { status: 400 }
            )
        }

        // ═══ VALIDACIÓN SÍNCRONA DE IMAGEN DE PORTADA ═══
        // Implementamos un "Filtro de Aire" inmediato: Si la portada no es un carro real, NO entra.
        const images = body.images || []
        if (images.length === 0) {
            return NextResponse.json(
                { error: 'La foto de portada es obligatoria' },
                { status: 400 }
            )
        }

        console.log(`🔍 Validando portada síncronamente para nuevo vehículo de ${user.id}...`)
        const { analyzeMultipleImages } = await import('@/lib/ai/imageAnalyzer')
        const { fetchImageAsBase64 } = await import('@/lib/ai-moderation-helper') // Necesitamos extraer este helper o uno similar

        // Obtener base64 de la portada (images[0])
        const coverBase64 = await fetchImageAsBase64(images[0])
        if (!coverBase64) {
            return NextResponse.json(
                { error: 'No se pudo procesar la imagen de portada. Intenta con otra.' },
                { status: 400 }
            )
        }

        // Llamar a Gemini (Modo Especial Portada ya implementado en analyzeMultipleImages)
        const coverAnalysis = await analyzeMultipleImages([coverBase64], 'VEHICLE')

        let isAiRejected = false
        if (!coverAnalysis.valid) {
            console.log(`❌ Portada rechazada por IA: ${coverAnalysis.reason}`)
            isAiRejected = true
            // YA NO BLOQUEAMOS: Se guardará como Borrador (Inactive) para revisión manual
        }

        // 🛡️ ANTI-FRAUDE & MONETIZACIÓN
        // Usamos lifetimeVehicleCount para determinar beneficios (BLINDAJE DE POR VIDA)
        // El primero es GRATIS DE VERDAD (6 Meses)
        let isFirstVehicle = (user.lifetimeVehicleCount || 0) === 0

        // Importar utilidades de huella digital
        const { savePublicationFingerprint, validatePublicationFingerprint, generateVehicleHash } = await import('@/lib/validateFingerprint')

        // Huella Backend: IP + DeviceHash (si viene) + GPS
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

        let deviceHash = 'unknown'
        const rawFingerprint = body.deviceFingerprint
        if (rawFingerprint) {
            if (typeof rawFingerprint === 'string') {
                deviceHash = rawFingerprint
            } else if (typeof rawFingerprint === 'object' && rawFingerprint.visitorId) {
                deviceHash = rawFingerprint.visitorId
            }
        }

        const isAdmin = user.isAdmin || session.user.email === process.env.ADMIN_EMAIL

        // 🛡️ VALIDAR HUELLA DIGITAL GLOBAL (Detecta fraude de varios correos en mismo cel)
        let isFraudulentRetry = false
        let fraudReason = ''

        if (deviceHash !== 'unknown' && !isAdmin) {
            const globalFraudCheck = await validatePublicationFingerprint({
                userId: user.id,
                publicationType: 'VEHICLE',
                latitude: body.latitude || 0,
                longitude: body.longitude || 0,
                deviceHash: deviceHash,
                ipAddress: clientIp
            })

            if (globalFraudCheck.isFraud) {
                console.log(`🛡️ Seguridad: Fraude Global detectado. Razón: ${globalFraudCheck.reason}`)
                isFraudulentRetry = true
                fraudReason = globalFraudCheck.reason

                // Si es fraude de múltiples cuentas, aplicar strike inmediatamente
                await prisma.user.update({
                    where: { id: user.id },
                    data: { fraudStrikes: { increment: 2 } } // Doble penalización por engaño multi-cuenta
                })
            }
        }

        // 🔍 Validar duplicados de contenido (Mismo carro republicado?)
        const contentHash = generateVehicleHash({
            brand: coverAnalysis.details?.brand || brand,
            model: coverAnalysis.details?.model || model,
            year: coverAnalysis.details?.year ? parseInt(coverAnalysis.details.year) : parseInt(year),
            color: coverAnalysis.details?.color || body.color,
            vehicleType: coverAnalysis.details?.type || body.vehicleType
        })

        if (!isFirstVehicle && !isAdmin && !isFraudulentRetry) {
            const recentDuplicates = await prisma.vehicle.findFirst({
                where: {
                    userId: user.id,
                    searchIndex: contentHash,
                    createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
                }
            })

            if (recentDuplicates) {
                console.log(`🛡️ Fraude detectado: Republicación de ${brand} ${model}. Strike +1`)
                isFraudulentRetry = true
                await prisma.user.update({
                    where: { id: user.id },
                    data: { fraudStrikes: { increment: 1 } }
                })
            }
        }

        // ═══ REGLAS FINALES DE MONETIZACIÓN (HISTÓRICA) ═══
        const now = new Date()
        let expiresAt = new Date()
        let isFreePublication = true
        let initialStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE' // Por defecto activo si pasa filtros

        const isPermanentlyRestricted = (user.fraudStrikes || 0) >= 10
        const lifetimeCount = user.lifetimeVehicleCount || 0

        if (isAdmin) {
            expiresAt.setFullYear(now.getFullYear() + 10)
            isFreePublication = true
        }
        else if (isPermanentlyRestricted || isFraudulentRetry || isAiRejected) {
            // Usuarios marcados, fraude detectado o RECHAZADO POR IA -> INACTIVO (Borrador)
            expiresAt = new Date()
            isFreePublication = false
            initialStatus = 'INACTIVE'
        }
        else if (lifetimeCount === 0) {
            // 1er Vehículo HISTÓRICO: 6 Meses Gratis
            expiresAt.setMonth(now.getMonth() + 6)
            isFreePublication = true
        }
        else if (lifetimeCount < 25) {
            // Vehículos 2 al 25 HISTÓRICOS: 7 Días Gratis
            expiresAt.setDate(now.getDate() + 7)
            isFreePublication = true
        }
        else {
            // Vehículo 26 en adelante HISTÓRICO: COBRO OBLIGATORIO
            expiresAt = new Date()
            isFreePublication = false
            initialStatus = 'INACTIVE' // Requiere pago para activarse
        }

        // Regenerar título si hubo corrección por IA o para asegurar consistencia
        const finalBrand = coverAnalysis.details?.brand || brand
        const finalModel = coverAnalysis.details?.model || model
        const finalYear = coverAnalysis.details?.year ? parseInt(coverAnalysis.details.year) : parseInt(year)
        const finalTitle = `${finalBrand} ${finalModel} ${finalYear}`

        // Crear vehículo
        const vehicle = await prisma.vehicle.create({
            data: {
                userId: user.id,
                title: finalTitle,
                description,
                brand: finalBrand,
                model: finalModel,
                year: finalYear,
                price: parseFloat(price),
                city,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                images: body.images || [],
                // Campos opcionales
                mileage: body.mileage ? parseInt(body.mileage) : null,
                transmission: body.transmission || null,
                fuel: body.fuel || null,
                engine: body.engine || null,
                color: coverAnalysis.details?.color || body.color,
                vehicleType: coverAnalysis.details?.type || body.vehicleType,
                currency: body.currency || 'MXN',

                // Campos adicionales restaurados
                features: body.features || [],
                traction: body.traction || null,
                condition: body.condition || null,
                doors: body.doors ? parseInt(body.doors) : null,
                passengers: body.passengers ? parseInt(body.passengers) : null,
                displacement: body.displacement ? parseInt(body.displacement) : null,
                cargoCapacity: body.cargoCapacity ? parseFloat(body.cargoCapacity) : null,
                operatingHours: body.operatingHours ? parseInt(body.operatingHours) : null,
                // ESTADO INICIAL
                status: initialStatus, // BLINDAJE: Empieza inactivo
                moderationStatus: isAiRejected ? 'REJECTED' : 'PENDING_AI',
                isFreePublication: isFreePublication,
                publishedAt: now,
                expiresAt: expiresAt,
                // Usamos searchIndex para guardar el hash de contenido y facilitar búsquedas futuras
                searchIndex: contentHash
            }
        })

        // 📈 INCREMENTAR CONTADOR HISTÓRICO
        // Solo si no fue rechazado por IA y no es un fraude flagrante.
        // Así los intentos fallidos no queman "vidas", pero las publicaciones reales sí.
        if (!isAiRejected && !isFraudulentRetry) {
            await prisma.user.update({
                where: { id: user.id },
                data: { lifetimeVehicleCount: { increment: 1 } }
            })
        }

        // 🛡️ GUARDAR HUELLA DIGITAL (Backend only)
        // Guardamos el registro para análisis futuro
        await savePublicationFingerprint({
            userId: user.id,
            publicationType: 'VEHICLE',
            publicationId: vehicle.id,
            latitude: latitude ? parseFloat(latitude) : 0,
            longitude: longitude ? parseFloat(longitude) : 0,
            ipAddress: clientIp,
            deviceHash: deviceHash,
            userAgent: request.headers.get('user-agent') || undefined
        })

        // 🌍 FRONTERA DIGITAL: Detectar país en segundo plano y actualizar
        if (latitude && longitude) {
            // No bloqueamos la respuesta, lo hacemos async
            (async () => {
                try {
                    // Intento de resolución de país (Nominatim libre)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`, {
                        headers: { 'User-Agent': 'CarMatchApp/1.0' }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        const countryCode = data.address?.country_code?.toUpperCase() || 'MX'

                        // Actualizar vehículo con el código de país real
                        // Mapeo básico: 'mx' -> 'MX', 'us' -> 'US'
                        await prisma.vehicle.update({
                            where: { id: vehicle.id },
                            data: { country: countryCode }
                        })
                    }
                } catch (err) {
                    console.error('Error detectando país del vehículo:', err)
                }
            })()
        }

        // 🚀 SEGURIDAD: Iniciar revisión por el Equipo de Seguridad en segundo plano
        import('@/lib/ai-moderation').then(mod => {
            mod.moderateVehicleListing(vehicle.id, vehicle.images)
                .catch(err => console.error('Error en revisión de seguridad:', err))
        })

        // 🔔 NOTIFICACIÓN REAL: Avisar a usuarios en la misma ciudad
        // "¡Nuevo [Marca] [Modelo] en [Ciudad]!"
        import('@/lib/push').then(async (push) => {
            try {
                // 1. Encontrar usuarios interesados en esta ciudad (excluyendo al dueño)
                // (En un sistema real filtraríamos por preferencias, aquí es "Broadcasting por Ciudad")
                const interestedUsers = await prisma.user.findMany({
                    where: {
                        city: city, // Misma ciudad
                        id: { not: user.id }, // No al dueño
                        pushSubscriptions: { some: {} } // Que tengan push
                    },
                    include: { pushSubscriptions: true },
                    take: 50 // Límite para no saturar en demo
                })

                if (interestedUsers.length === 0) return

                const alert = {
                    title: `📍 Nuevo en ${city}`,
                    body: `${brand} ${model} ${year} - $${new Intl.NumberFormat('es-MX').format(parseFloat(price))}`,
                    url: `/vehicles/${vehicle.id}`
                }

                // 2. Enviar notificaciones
                for (const u of interestedUsers) {
                    for (const sub of u.pushSubscriptions) {
                        await push.sendPushNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        }, alert)
                    }
                }
            } catch (e) {
                console.error('Push Alert Error:', e)
            }
        })

        let successMessage = '¡Publicación enviada! Nuestro equipo la verificará pronto. Recuerda que los datos reales atraen a más compradores.'
        if (isPermanentlyRestricted) {
            successMessage = 'Cuenta restringida. El anuncio se guardó como BORRADOR. Puedes activarlo con un crédito o contactar a soporte.'
        } else if (isFraudulentRetry) {
            successMessage = 'Se detectaron múltiples cuentas. Para mantener la confianza en la red, puedes activar este anuncio usando 1 crédito.'
        } else if (isAiRejected) {
            successMessage = `La IA detectó que los datos o fotos podrían no coincidir (${coverAnalysis.reason || 'Imagen inusual'}). Entre más reales sean tus datos, más rápido venderás. Puedes corregirlo o activarlo con 1 crédito.`
        }

        return NextResponse.json({
            success: true,
            vehicle: {
                id: vehicle.id,
                title: vehicle.title,
                moderationStatus: isAiRejected ? 'REJECTED' : 'APPROVED',
                // Indicar al frontend si se publicó activo o requiere pago
                status: (isFraudulentRetry || isPermanentlyRestricted || isAiRejected) ? 'INACTIVE' : 'ACTIVE',
                message: successMessage
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error al crear vehículo:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

/**
 * API endpoint para obtener vehículos del usuario
 * GET /api/vehicles
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        const vehicles = await prisma.vehicle.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            vehicles
        })

    } catch (error) {
        console.error('Error al obtener vehículos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
