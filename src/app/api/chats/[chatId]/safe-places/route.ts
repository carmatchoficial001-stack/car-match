import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

        // 🤖 IA: ANALISTA DE DATOS (SUPER INTELIGENTE)
        // Usamos Gemini para generar un Tip de Analista y descripciones basadas en el contexto del vehículo
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
        let aiTip = isMidpoint
            ? '💡 Hemos calculado un punto medio justo para ambos. Siempre reúnanse de día.'
            : '💡 Te sugerimos lugares cerca del vehículo. Siempre reúnete en un lugar público.'

        if (apiKey) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai')
                const genAI = new GoogleGenerativeAI(apiKey)
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

                const prompt = `
                    Actúa como el "SUPER ANALISTA DE DATOS" de CarMatch.
                    Contexto: Se planea una reunión para ver un ${chat.vehicle.brand} ${chat.vehicle.model}.
                    Ubicación central: ${chat.vehicle.city}.
                    ¿Es punto medio?: ${isMidpoint ? 'SÍ' : 'NO'}.

                    Genera un "TIP DE ANALISTA" (máx 150 caracteres) que sea técnico y de seguridad.
                    Ejemplo: "🚨 ANALISTA: El punto medio detectado es ideal. Recomiendo revisar el número de serie con luz natural y verificar que el motor no esté caliente al llegar."

                    Responde SOLO con el texto del tip.
                `
                const result = await model.generateContent(prompt)
                aiTip = result.response.text().trim()
            } catch (err) {
                console.error('Error in Safe Places AI:', err)
            }
        }

        // Lugares seguros sugeridos (estratégicos cerca del centro calculado)
        const suggestedPlaces = [
            {
                id: 1,
                name: isMidpoint ? `Punto Medio - Plaza Comercial` : `Plaza Comercial - ${chat.vehicle.city}`,
                type: 'shopping_mall',
                description: 'Centro comercial con estacionamiento amplio y cámaras de seguridad. Ideal para inspecciones visuales.',
                address: `Zona Segura, Cerca de ti`,
                distance: 0.5,
                latitude: centerLat + 0.005,
                longitude: centerLon - 0.005,
                icon: '🏛️',
                safetyFeatures: ['Cámaras de seguridad', 'Mucha afluencia', 'Iluminación alta']
            },
            {
                id: 2,
                name: `Módulo de Seguridad / Ministerio Público`,
                type: 'police',
                description: 'Zona de intercambio segura oficial. El mejor lugar para verificar documentos y números de serie.',
                address: `Sector de Seguridad Pública`,
                distance: 1.2,
                latitude: centerLat - 0.008,
                longitude: centerLon + 0.003,
                icon: '👮',
                safetyFeatures: ['Vigilancia policiaca', 'Zona oficial', 'Grabación 24/7']
            },
            {
                id: 3,
                name: `Taller / Gasolinera Autorizada`,
                type: 'gas_station',
                description: 'Punto concurrido. Recomendado si necesitas levantar el auto para revisar fugas menores.',
                address: `Av. Principal`,
                distance: 2.0,
                latitude: centerLat + 0.012,
                longitude: centerLon + 0.012,
                icon: '⛽',
                safetyFeatures: ['Alto tráfico', 'Personal presente', 'Cámaras']
            }
        ]

        return NextResponse.json({
            suggestions: suggestedPlaces,
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
