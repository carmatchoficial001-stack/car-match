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
            select: { id: true, fraudStrikes: true, isAdmin: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        const body = await request.json()

        // Validar campos requeridos
        const { title, description, brand, model, year, price, city, latitude, longitude } = body

        if (!title || !description || !brand || !model || !year || !price || !city) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
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
        // Verificar historial de vehículos para definir beneficios (6 meses / 7 días / cobro)
        const vehicleCount = await prisma.vehicle.count({
            where: { userId: user.id }
        })

        // El primero es GRATIS DE VERDAD (6 Meses)
        let isFirstVehicle = vehicleCount === 0

        // Importar utilidades de huella digital
        const { savePublicationFingerprint, validatePublicationFingerprint, generateVehicleHash } = await import('@/lib/validateFingerprint')

        // Huella Backend: IP + DeviceHash (si viene) + GPS
        // Nota: Si el frontend no envía deviceFingerprint (porque no se puede tocar), usamos 'unknown' pero validamos IP y Contenido
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

        let deviceHash = 'unknown'
        const rawFingerprint = body.deviceFingerprint
        if (rawFingerprint) {
            if (typeof rawFingerprint === 'string') {
                deviceHash = rawFingerprint
            } else if (typeof rawFingerprint === 'object' && rawFingerprint.visitorId) {
                deviceHash = rawFingerprint.visitorId
            } else {
                // Fallback for unexpected objects
                deviceHash = JSON.stringify(rawFingerprint).slice(0, 100)
            }
        }

        // 🔍 Validar duplicados de contenido (Mismo carro republicado?)
        // Generamos un hash del contenido del vehículo
        const contentHash = generateVehicleHash({
            brand,
            model,
            year: parseInt(year),
            color: body.color,
            vehicleType: body.vehicleType,
            transmission: body.transmission,
            engine: body.engine
        })

        // Verificar si ya publicó este mismo vehículo recientemente para abusar de días gratis
        // Lógica de LOTE: Permitimos muchos vehículos, pero no el MISMO vehículo físico para ganar tiempo gratis
        // Si detectamos fraude, NO damos días gratis.
        let isFraudulentRetry = false

        // SISTEMA DE STRIKES (Protección contra abuso recurrente)
        // 1. Un usuario legal (Lote) tiene muchos carros distintos -> OK
        // 2. Un abusador borra y resube el MISMO carro muchas veces -> FRAUDE

        const isPermanentlyRestricted = (user.fraudStrikes || 0) >= 10

        const isAdmin = user.isAdmin || session.user.email === process.env.ADMIN_EMAIL

        // 🛡️ VALIDAR HUELLA DIGITAL GLOBAL (Detecta fraude de varios correos en mismo cel)
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

                // Si es fraude de múltiples cuentas, aplicar strike inmediatamente
                await prisma.user.update({
                    where: { id: user.id },
                    data: { fraudStrikes: { increment: 2 } } // Doble penalización por engaño multi-cuenta
                })
            }
        }

        if (!isFirstVehicle && !isAdmin && !isFraudulentRetry) {
            // Buscar duplicados recientes (mismo carro físico) del MISMO usuario
            const recentDuplicates = await prisma.vehicle.findFirst({
                where: {
                    userId: user.id,
                    searchIndex: contentHash,
                    status: { in: ['SOLD', 'INACTIVE'] },
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            })

            if (recentDuplicates) {
                console.log(`🛡️ Fraude detectado: Usuario republicando vehículo ${brand} ${model}. Strike +1`)
                isFraudulentRetry = true

                await prisma.user.update({
                    where: { id: user.id },
                    data: { fraudStrikes: { increment: 1 } }
                })
            }
        }

        // ═══ REGLAS FINALES DE MONETIZACIÓN ═══
        const now = new Date()
        let expiresAt = new Date()
        let isFreePublication = true

        if (isAdmin) {
            // ⭐ ADMIN PERKS: 10 años gratis
            expiresAt.setFullYear(now.getFullYear() + 10)
            isFreePublication = true
        }
        else if (isPermanentlyRestricted) {
            // 🚫 VETADO: Usuario con historial de abuso (>10 strikes).
            // Siempre paga desde el día 1, sin excepciones.
            expiresAt = new Date()
            isFreePublication = false
        }
        else if (isFraudulentRetry) {
            // ⚠️ CASTIGO PUNTUAL: Intento de fraude actual.
            // Paga por este vehículo.
            expiresAt = new Date()
            isFreePublication = false
        }
        else if (isFirstVehicle) {
            // ✅ BENEFICIO DE ENGANCHE: 6 Meses Gratis
            expiresAt.setMonth(now.getMonth() + 6)
            isFreePublication = true
        }
        else {
            // ✅ BENEFICIO ESTÁNDAR: 7 Días Gratis (Estrategia de gancho para vendedores)
            expiresAt.setDate(now.getDate() + 7)
            isFreePublication = true
        }

        // Crear vehículo
        const vehicle = await prisma.vehicle.create({
            data: {
                userId: user.id,
                title,
                description,
                brand,
                model,
                year: parseInt(year),
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
                color: body.color || null,
                vehicleType: body.vehicleType || null,
                doors: body.doors ? parseInt(body.doors) : null,
                passengers: body.passengers ? parseInt(body.passengers) : null,
                traction: body.traction || null,
                condition: body.condition || null,
                currency: body.currency || 'MXN',
                features: body.features || [],
                displacement: body.displacement ? parseInt(body.displacement) : null,
                cargoCapacity: body.cargoCapacity ? parseFloat(body.cargoCapacity) : null,
                operatingHours: body.operatingHours ? parseInt(body.operatingHours) : null,

                // ESTADO INICIAL
                // Si es fraude -> INACTIVO. Si es legítimo -> ACTIVO.
                status: (isFraudulentRetry || isPermanentlyRestricted) ? 'INACTIVE' : 'ACTIVE',
                moderationStatus: 'APPROVED',

                isFreePublication: isFreePublication,
                publishedAt: now,
                expiresAt: expiresAt,
                // Usamos searchIndex para guardar el hash de contenido y facilitar búsquedas futuras
                searchIndex: contentHash
            }
        })

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

        return NextResponse.json({
            success: true,
            vehicle: {
                id: vehicle.id,
                title: vehicle.title,
                moderationStatus: 'APPROVED',
                // Indicar al frontend si se publicó activo o requiere pago
                status: (isFraudulentRetry || isPermanentlyRestricted) ? 'INACTIVE' : 'ACTIVE',
                message: isPermanentlyRestricted
                    ? 'Nuestro equipo de seguridad ha restringido los beneficios gratuitos en esta cuenta por intentos de abuso. Se requiere activación por créditos.'
                    : isFraudulentRetry
                        ? 'Se detectó una publicación duplicada. Para mantener la calidad del mercado, este vehículo requiere activación por seguridad.'
                        : '¡Publicación enviada a nuestro equipo de seguridad! En breve será verificado.'
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
