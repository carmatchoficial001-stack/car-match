import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

/**
 * Helper: Preparar data de MapStore para inserción
 */
function prepareMapStoreData(data: any) {
    const prepared: any = {}

    if (data.category) prepared.category = data.category
    if (data.subcategory) prepared.subcategory = data.subcategory
    if (data.city) prepared.city = data.city
    if (data.latitude) prepared.latitude = parseFloat(data.latitude)
    if (data.longitude) prepared.longitude = parseFloat(data.longitude)
    if (data.searchQuery) prepared.searchQuery = data.searchQuery
    if (data.distanceKm) prepared.distanceKm = parseFloat(data.distanceKm)
    if (data.clicked !== undefined) prepared.clicked = data.clicked

    return prepared
}

/**
 * POST /api/analytics/track
 * Endpoint centralizado para el "Cerebro de Estadísticas"
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        const body = await request.json()
        const { eventType, entityType, entityId, metadata } = body

        // Campos nuevos para MapStore analytics
        const {
            category,
            subcategory,
            city,
            latitude,
            longitude,
            businessId,
            vehicleId,
            searchQuery,
            distanceKm,
            clicked
        } = body

        if (!eventType) {
            return NextResponse.json({ error: 'eventType required' }, { status: 400 })
        }

        await prisma.analyticsEvent.create({
            data: {
                userId: session?.user?.id || null,
                eventType,
                entityType: entityType || null,
                entityId: entityId || businessId || vehicleId || null,

                // MapStore específico
                ...prepareMapStoreData({
                    category,
                    subcategory,
                    city,
                    latitude,
                    longitude,
                    searchQuery,
                    distanceKm,
                    clicked
                }),

                metadata: metadata || {}
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Analytics Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
