import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeGenerateContent } from '@/lib/ai/geminiClient'

// Función para calcular punto medio entre dos coordenadas GPS
function getMidpoint(lat1: number, lon1: number, lat2: number, lon2: number) {
    const latMid = (lat1 + lat2) / 2
    const lonMid = (lon1 + lon2) / 2
    return { lat: latMid, lon: lonMid }
}

// Función para calcular distancia en km entre dos puntos GPS (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// GET /api/chats/[chatId]/safe-places - Sugerir lugares seguros para reunirse
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const { chatId } = await params
        const searchParams = request.nextUrl.searchParams
        const userLatParam = searchParams.get('lat')
        const userLonParam = searchParams.get('lon')

        // Obtener el chat con la información del vehículo
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                vehicle: true
            }
        })

        if (!chat) {
            return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
        }

        if (chat.buyerId !== user.id && chat.sellerId !== user.id) {
            return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
        }

        // Verificar que el vehículo tiene coordenadas GPS
        if (!chat.vehicle.latitude || !chat.vehicle.longitude) {
            return NextResponse.json({
                error: 'El vehículo no tiene ubicación GPS registrada',
                suggestions: []
            }, { status: 200 })
        }

        let centerLat = chat.vehicle.latitude
        let centerLon = chat.vehicle.longitude
        let isMidpoint = false

        // Si el usuario envió sus coordenadas, calculamos el punto medio
        if (userLatParam && userLonParam) {
            const uLat = parseFloat(userLatParam)
            const uLon = parseFloat(userLonParam)
            if (!isNaN(uLat) && !isNaN(uLon)) {
                const midpoint = getMidpoint(centerLat, centerLon, uLat, uLon)
                centerLat = midpoint.lat
                centerLon = midpoint.lon
                isMidpoint = true
            }
        }

        // IA Tip Lógica básica si falla Gemini
        let aiTip = isMidpoint
            ? '💡 Hemos calculado un punto medio justo para ambos. Siempre reúnanse de día.'
            : '💡 Te sugerimos lugares cerca del vehículo. Siempre reúnete en un lugar público.'

        try {
            const prompt = `
                Actúa como el "SUPER ANALISTA DE DATOS" de CarMatch.
                Contexto: Se planea una reunión para ver un ${chat.vehicle.brand} ${chat.vehicle.model}.
                Ubicación central: ${chat.vehicle.city}.
                ¿Es punto medio?: ${isMidpoint ? 'SÍ' : 'NO'}.

                Genera un "TIP DE ANALISTA" (máx 150 caracteres) que sea técnico y de seguridad.
                Ejemplo: "🚨 ANALISTA: El punto medio detectado es ideal. Recomiendo revisar el número de serie con luz natural y verificar que el motor no esté caliente al llegar."

                Responde SOLO con el texto del tip.
            `
            const response = await safeGenerateContent(prompt)
            if (response.text()) {
                aiTip = response.text().trim()
            }
        } catch (err) {
            console.error('Error in Safe Places AI:', err)
        }

        // Lugares públicos genéricos (Desactivados por solicitud del usuario)
        const suggestedPlaces: any[] = []

        // 🛍️ CARGAR NEGOCIOS REGISTRADOS QUE SON PUNTOS SEGUROS
        const nearbySafeBusinesses = await prisma.business.findMany({
            where: {
                isSafeMeetingPoint: true,
                isActive: true,
                city: chat.vehicle.city
            },
            take: 10
        })

        const businessSugerences = nearbySafeBusinesses.map(b => ({
            id: `business-${b.id}`,
            name: b.name,
            type: 'business',
            description: b.description || 'Negocio verificado en CarMatch.',
            address: b.address,
            distance: Number(getDistance(centerLat, centerLon, b.latitude, b.longitude).toFixed(1)),
            latitude: b.latitude,
            longitude: b.longitude,
            icon: '🏪',
            isOfficialBusiness: true,
            safetyFeatures: ['Negocio verificado', 'Cámaras del local', 'Personal presente']
        }))

        // Combinar y ordenar por distancia
        const allSuggestions = [...suggestedPlaces, ...businessSugerences].sort((a, b) => Number(a.distance) - Number(b.distance))

        return NextResponse.json({
            suggestions: allSuggestions,
            vehicleLocation: {
                city: chat.vehicle.city,
                latitude: chat.vehicle.latitude,
                longitude: chat.vehicle.longitude
            },
            centerLocation: {
                latitude: centerLat,
                longitude: centerLon,
                isMidpoint
            },
            tip: aiTip
        })

    } catch (error) {
        console.error('Error al obtener lugares seguros:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
