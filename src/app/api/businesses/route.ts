import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * POST /api/businesses
 * Crear nuevo negocio con lógica de monetización:
 * - Primer negocio: 3 MESES GRATIS
 * - Siguientes: Requieren 1 crédito (se descuenta y se da 1 mes)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            name,
            category,
            description,
            address,
            street,
            streetNumber,
            colony,
            city,
            state,
            phone,
            additionalPhones = [],
            whatsapp,
            telegram,
            website,
            facebook,
            instagram,
            tiktok,
            hours,
            latitude,
            longitude,
            images = [],
            services = []
        } = body

        // Validaciones básicas
        if (!name || !category || !address || !city || !latitude || !longitude) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: name, category, address, city, latitude, longitude' },
                { status: 400 }
            )
        }

        // Verificar que el usuario realmente existe en la DB (evitar error de Foreign Key si se borró la DB)
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!userExists) {
            return NextResponse.json(
                { error: 'Usuario no encontrado. Por favor cierra sesión y vuelve a ingresar.' },
                { status: 401 }
            )
        }

        // Contar negocios del usuario para saber si es el primero
        const businessCount = await prisma.business.count({
            where: { userId: session.user.id }
        })

        const isFirstBusiness = businessCount === 0

        // 💰 MONETIZACIÓN DE NEGOCIOS
        // Primer negocio: 3 MESES GRATIS
        // Negocios 2+: REQUIEREN 1 CRÉDITO para estar activos. Si no hay, se crean como INACTIVOS (Borrador).

        const isAdmin = userExists.isAdmin || session.user.email === process.env.ADMIN_EMAIL

        // Obtener créditos actuales
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        })
        const hasCredits = (user?.credits || 0) >= 1

        let expiresAt: Date | null = null
        let isFreePublication = false
        let isActive = false
        let creditCharged = false

        if (isAdmin) {
            // ⭐ ADMIN PERKS: 10 años gratis
            isActive = true
            expiresAt = new Date()
            expiresAt.setFullYear(expiresAt.getFullYear() + 10)
            isFreePublication = true
        } else if (isFirstBusiness) {
            // PRIMER NEGOCIO: 3 MESES GRATIS
            isActive = true
            expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + 3)
            isFreePublication = true
        } else if (hasCredits) {
            // SIGUIENTES NEGOCIOS CON CRÉDITO: 1 mes y se activa
            isActive = true
            expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + 1)
            isFreePublication = false
            creditCharged = true

            // Descontar el crédito inmediatamente
            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: 1 } }
            })
        } else {
            // SIGUIENTES NEGOCIOS SIN CRÉDITO: Se crea como INACTIVO (Borrador)
            isActive = false
            expiresAt = null
            isFreePublication = false
            creditCharged = false
        }

        // 🛡️ VALIDAR HUELLA DIGITAL para detectar duplicados
        const { fingerprint } = body
        // ... (resto de validaciones de huella)
        if (!fingerprint?.deviceHash && !isAdmin) {
            return NextResponse.json(
                { error: 'Huella digital requerida' },
                { status: 400 }
            )
        }

        // Importar validateFingerprint
        const { validatePublicationFingerprint, savePublicationFingerprint } = await import('@/lib/validateFingerprint')

        if (!isAdmin) {
            const fraudCheck = await validatePublicationFingerprint({
                userId: session.user.id,
                publicationType: 'BUSINESS',
                latitude,
                longitude,
                deviceHash: fingerprint.deviceHash,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
            })

            if (fraudCheck.isFraud) {
                return NextResponse.json(
                    { error: `No puedes publicar: ${fraudCheck.reason}` },
                    { status: 400 }
                )
            }
        }

        // Crear negocio
        const business = await prisma.business.create({
            data: {
                userId: session.user.id,
                name: name.trim(),
                category,
                description: description?.trim() || null,
                address: address.trim(),
                street: street?.trim() || null,
                streetNumber: streetNumber?.trim() || null,
                colony: colony?.trim() || null,
                city: city.trim(),
                state: state?.trim() || null,
                country: 'MX', // Default
                phone: phone?.trim() || null,
                additionalPhones: Array.isArray(additionalPhones) ? additionalPhones : [],
                whatsapp: whatsapp?.trim() || null,
                telegram: telegram?.trim() || null,
                website: website?.trim() || null,
                facebook: facebook?.trim() || null,
                instagram: instagram?.trim() || null,
                tiktok: tiktok?.trim() || null,
                hours: hours?.trim() || null,
                latitude: typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude),
                longitude: typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude),
                images: Array.isArray(images) ? images : [],
                is24Hours: body.is24Hours || false,
                hasEmergencyService: body.hasEmergencyService || false,
                hasHomeService: body.hasHomeService || false,
                isActive, // Dinámico según créditos
                isFreePublication,
                publishedAt: new Date(),
                expiresAt,
                services: Array.isArray(services) ? services : []
            },
            include: {
                user: { select: { name: true, image: true } }
            }
        })

        // 🛡️ GUARDAR HUELLA después de crear
        await savePublicationFingerprint({
            userId: session.user.id,
            publicationType: 'BUSINESS',
            publicationId: business.id,
            latitude: business.latitude,
            longitude: business.longitude,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            deviceHash: fingerprint.deviceHash,
            userAgent: request.headers.get('user-agent') || undefined
        })

        // 🚀 SEGURIDAD: Iniciar revisión en segundo plano (solo si tiene fotos)
        if (business.images.length > 0) {
            import('@/lib/ai-moderation').then(mod => {
                mod.moderateBusinessListing(business.id, business.images)
                    .catch(err => console.error('Error en revisión de seguridad de negocio:', err))
            })
        }

        return NextResponse.json({
            business,
            message: isFirstBusiness
                ? '¡Negocio creado con éxito! Disfruta de 3 MESES GRATIS 🎉'
                : creditCharged
                    ? '✅ Negocio creado y activado. Se descontó 1 crédito.'
                    : '📝 Negocio guardado como BORRADOR. Adquiere créditos para activarlo en el mapa.',
            isFirstBusiness,
            creditCharged,
            status: isActive ? 'ACTIVE' : 'DRAFT'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creando negocio:', error)
        return NextResponse.json(
            { error: `Error al crear negocio: ${(error as Error).message}` },
            { status: 500 }
        )
    }
}

/**
 * GET /api/businesses?userId=xxx
 * Obtener negocios del usuario autenticado o de otro usuario
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        const searchParams = request.nextUrl.searchParams
        const userId = searchParams.get('userId') || session?.user?.id

        if (!userId) {
            return NextResponse.json(
                { error: 'userId requerido' },
                { status: 400 }
            )
        }

        // Si es el propietario, mostrar todos (activos e inactivos)
        // Si es visitante, solo mostrar activos
        const isOwner = session?.user?.id === userId

        const whereClause: any = { userId }

        if (!isOwner) {
            whereClause.isActive = true
            whereClause.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }

        const businesses = await prisma.business.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Map boolean isActive to string status for frontend compatibility
        const mappedBusinesses = businesses.map(b => ({
            ...b,
            status: (b.isActive && (!b.expiresAt || new Date(b.expiresAt) > new Date())) ? 'ACTIVE' : 'INACTIVE'
        }))

        return NextResponse.json({ businesses: mappedBusinesses })

    } catch (error) {
        console.error('Error obteniendo negocios:', error)
        return NextResponse.json(
            { error: `Error al obtener negocios: ${(error as Error).message}` },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const body = await request.json()
        const {
            id,
            name,
            category,
            description,
            address,
            street,
            streetNumber,
            colony,
            city,
            state,
            phone,
            additionalPhones = [],
            whatsapp,
            telegram,
            website,
            facebook,
            instagram,
            tiktok,
            hours,
            latitude,
            longitude,
            images,
            services
        } = body

        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

        // Verificar propiedad
        const existing = await prisma.business.findUnique({ where: { id } })
        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const updated = await prisma.business.update({
            where: { id },
            data: {
                name: name?.trim(),
                category,
                description: description?.trim(),
                address: address?.trim(),
                street: street?.trim(),
                streetNumber: streetNumber?.trim(),
                colony: colony?.trim(),
                city: city?.trim(),
                state: state?.trim(),
                phone: phone?.trim(),
                additionalPhones,
                whatsapp: whatsapp?.trim(),
                telegram: telegram?.trim(),
                website: website?.trim(),
                facebook: facebook?.trim(),
                instagram: instagram?.trim(),
                tiktok: tiktok?.trim(),
                hours: hours?.trim(),
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                images,
                services: Array.isArray(services) ? services : undefined
            }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error('Error actualizando negocio:', error)
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

        const existing = await prisma.business.findUnique({ where: { id } })
        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await prisma.business.delete({ where: { id } })
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error eliminando negocio:', error)
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }
}
