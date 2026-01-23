import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { serializeDecimal } from '@/lib/serialize'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const minLat = parseFloat(searchParams.get('minLat') || '')
        const maxLat = parseFloat(searchParams.get('maxLat') || '')
        const minLng = parseFloat(searchParams.get('minLng') || '')
        const maxLng = parseFloat(searchParams.get('maxLng') || '')
        const category = searchParams.get('category')

        if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
            return NextResponse.json({ error: 'Missing or invalid bounds' }, { status: 400 })
        }

        // Search within bounds
        // Handle longitude wrap-around (crossing the anti-meridian)
        let lngFilter: any = {
            gte: minLng,
            lte: maxLng
        }

        if (minLng > maxLng) {
            // Crossing the anti-meridian
            lngFilter = {
                OR: [
                    { gte: minLng },
                    { lte: maxLng }
                ]
            }
        }

        const businesses = await prisma.business.findMany({
            where: {
                isActive: true,
                latitude: {
                    gte: minLat,
                    lte: maxLat
                },
                longitude: lngFilter,
                ...(category && category !== 'all' ? { category } : {})
            },
            select: {
                id: true,
                name: true,
                category: true,
                latitude: true,
                longitude: true,
                city: true,
                state: true,
                address: true,
                street: true,
                streetNumber: true,
                colony: true,
                images: true,
                description: true,
                services: true,
                phone: true,
                whatsapp: true,
                telegram: true,
                website: true,
                facebook: true,
                instagram: true,
                tiktok: true,
                hours: true,
                additionalPhones: true,
                is24Hours: true,
                hasEmergencyService: true,
                hasHomeService: true,
                isSafeMeetingPoint: true,
                hasMiniWeb: true,
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            },
            take: 300 // Limit results per chunk to keep browser response snappy
        })

        return NextResponse.json({
            businesses: serializeDecimal(businesses)
        })

    } catch (error) {
        console.error('Error fetching businesses by bounds:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
