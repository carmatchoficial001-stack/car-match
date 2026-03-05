import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * 🛠️ Helpers para parseo robusto de tipos
 */
const safeInt = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const parsed = parseInt(val.toString().replace(/[^0-9-]/g, ''));
    return isNaN(parsed) ? null : parsed;
};

const safeFloat = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const parsed = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
};

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
            select: { id: true, fraudStrikes: true, isAdmin: true, lifetimeVehicleCount: true, country: true, credits: true }
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

        // 🔍 Validar duplicados de contenido (Mismo carro republicado?)
        const contentHash = generateVehicleHash({
            brand: brand,
            model: model,
            year: parseInt(year),
            color: body.color,
            vehicleType: body.vehicleType
        })

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
                ipAddress: clientIp,
                vehicleHash: contentHash
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

        // 🔄 REGLAS FINALES DE MONETIZACIÓN (HISTÓRICAS) ═══
        // Rule 1: First vehicle ever is FREE for 6 months
        // Rule 2: Vehicles 2-25 are FREE for 7 days
        // Rule 3: Vehicle 26+ is PAID immediately
        const now = new Date()
        let expiresAt = new Date()
        let isFreePublication = true
        let initialStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE'

        const isPermanentlyRestricted = (user.fraudStrikes || 0) >= 10
        const lifetimeCount = user.lifetimeVehicleCount || 0

        // Regenerar título respetando datos del usuario (Movido arriba para evitar ReferenceError)
        const finalBrand = brand || 'Desconocido'
        const finalModel = model || 'N/A'
        const finalVersion = body.version || ''
        const finalYear = parseInt(year) || new Date().getFullYear()
        const finalTitle = `${finalBrand} ${finalModel} ${finalVersion} ${finalYear}`.replace(/\s+/g, ' ').trim()

        if (isAdmin) {
            expiresAt.setFullYear(now.getFullYear() + 10)
            isFreePublication = true
        }
        else if (isPermanentlyRestricted) {
            expiresAt.setDate(now.getDate() + 30)
            isFreePublication = false
            initialStatus = 'INACTIVE'
        }
        else if (lifetimeCount === 0) {
            expiresAt.setMonth(now.getMonth() + 6)
            isFreePublication = true
        }
        else if (lifetimeCount < 25) {
            expiresAt.setDate(now.getDate() + 7)
            isFreePublication = true
        }
        else {
            isFreePublication = false
            if (body.useCredit === true && user.credits > 0) {
                expiresAt.setDate(now.getDate() + 30)
                initialStatus = 'ACTIVE'
            } else {
                expiresAt = new Date()
                initialStatus = 'INACTIVE'
            }
        }

        // 🛡️ EJECUCIÓN ATÓMICA (Crédito + Registro + Contador)
        const vehicle = await prisma.$transaction(async (tx) => {
            // 1. Cobrar crédito si corresponde (Ignorar si es Admin)
            if (!isAdmin && lifetimeCount >= 25 && body.useCredit === true && user.credits > 0) {
                console.log(`💳 Procesando crédito para usuario ${user.id}`);
                await tx.user.update({
                    where: { id: user.id },
                    data: { credits: { decrement: 1 } }
                });

                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -1,
                        description: `Publicación de vehículo (Límite 25 excedido): ${finalTitle}`,
                        details: { action: 'USE_CREDIT_PUBLISH', lifetimeCount }
                    }
                });
            }

            // 2. Crear el vehículo
            const newVehicle = await tx.vehicle.create({
                data: {
                    userId: user.id,
                    title: finalTitle,
                    description,
                    brand: finalBrand,
                    model: finalModel,
                    version: finalVersion || null,
                    year: finalYear,
                    price: parseFloat(price),
                    city,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    images: body.images || [],
                    mileage: safeInt(body.mileage),
                    transmission: body.transmission || null,
                    fuel: body.fuel || null,
                    engine: body.engine || null,
                    color: body.color || null,
                    vehicleType: body.vehicleType || null,
                    currency: body.currency || 'MXN',
                    features: body.features || [],
                    traction: body.traction || null,
                    condition: body.condition || null,
                    doors: safeInt(body.doors),
                    passengers: safeInt(body.passengers),
                    displacement: safeInt(body.displacement),
                    cargoCapacity: safeFloat(body.cargoCapacity),
                    operatingHours: safeInt(body.operatingHours),
                    hp: safeInt(body.hp),
                    torque: body.torque || null,
                    aspiration: body.aspiration || null,
                    cylinders: safeInt(body.cylinders),
                    batteryCapacity: safeFloat(body.batteryCapacity),
                    range: safeInt(body.range),
                    weight: safeInt(body.weight),
                    axles: safeInt(body.axles),
                    status: initialStatus,
                    moderationStatus: 'PENDING_AI',
                    isFreePublication: isFreePublication,
                    publishedAt: now,
                    expiresAt: expiresAt,
                    searchIndex: contentHash
                }
            });

            // 3. Incrementar contador histórico de forma segura
            if (!isFraudulentRetry) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { lifetimeVehicleCount: { increment: 1 } }
                });
            }

            return newVehicle;
        });

        // 🛡️ GUARDAR HUELLA DIGITAL (Backend only)
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
                    const restrictedAdminEmail = 'carmatchoficial001@gmail.com'

                    // 🛡️ REGLA ESTRICTA: Este admin solo puede publicar en MÉXICO
                    if (session.user.email === restrictedAdminEmail) {
                        console.log('🔒 Enforcing Digital Border: Restricted Admin -> Force MX')
                        await prisma.vehicle.update({
                            where: { id: vehicle.id },
                            data: { country: 'MX' }
                        })
                        return // Skip geocoding
                    }

                    // Intento de resolución de país (Nominatim libre)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`, {
                        headers: { 'User-Agent': 'CarMatchApp/1.0' }
                    })

                    let countryCode = 'MX' // Default final fallback

                    if (res.ok) {
                        const data = await res.json()
                        countryCode = data.address?.country_code?.toUpperCase()
                    }

                    // Si falló Nominatim, usar país del usuario como fallback inteligente
                    if (!countryCode) {
                        countryCode = user.country || 'MX'
                    }

                    // Actualizar vehículo con el código de país real
                    // Mapeo básico: 'mx' -> 'MX', 'us' -> 'US'
                    await prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: { country: countryCode }
                    })

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

        // 🔔 REAL-TIME SOCKET EMISSION: Avisar al feed global / market
        const io = (global as any).io
        if (io) {
            console.log(`📡 Emitting global event: new_vehicle_published for ${vehicle.id}`)
            io.emit('new_vehicle_published', {
                id: vehicle.id,
                title: vehicle.title,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                price: vehicle.price,
                currency: vehicle.currency,
                city: vehicle.city,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                images: body.images || [],
                feedType: 'VEHICLE',
                createdAt: new Date()
            })
        }

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

        let successMessage = '¡Anuncio publicado con éxito! 🚀 Ya es visible en el mercado.'
        if (isPermanentlyRestricted) {
            successMessage = 'Cuenta restringida. El anuncio se guardó como BORRADOR. Puedes activarlo con un crédito o contactar a soporte.'
        }

        // 🔄 REVALIDACIÓN DE CACHÉ: Actualizar listas inmediatamente
        revalidatePath('/profile')   // Mis Vehículos
        revalidatePath('/market')    // MarketCar
        revalidatePath('/swipe')     // CarMatch
        revalidatePath('/map-store') // Por si acaso (negocios vinculados)

        return NextResponse.json({
            success: true,
            vehicle: {
                id: vehicle.id,
                title: vehicle.title,
                moderationStatus: 'PENDING_AI',
                // Indicar al frontend si se publicó activo o requiere pago
                status: (isFraudulentRetry || isPermanentlyRestricted) ? 'INACTIVE' : 'ACTIVE',
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
