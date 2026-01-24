import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Admin check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true, email: true }
        })

        if (!user?.isAdmin && user?.email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const [recentSearches, activeVehicles, allBusinesses] = await Promise.all([
            prisma.searchMetric.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                select: { latitude: true, longitude: true, category: true, brand: true, model: true, maxPrice: true, color: true, transmission: true, fuel: true, query: true }
            }),
            prisma.vehicle.findMany({
                where: { status: 'ACTIVE' },
                select: { latitude: true, longitude: true, title: true, vehicleType: true, brand: true, model: true, price: true }
            }),
            prisma.business.findMany({
                select: { latitude: true, longitude: true, name: true, category: true }
            })
        ])

        // 🧠 Data Aggregation for Professional Dashboard
        const aggregate = (arr: any[], key: string) => {
            const counts = arr.reduce((acc: any, item) => {
                const val = item[key]
                if (val) acc[val] = (acc[val] || 0) + 1
                return acc
            }, {})
            return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10)
        }

        return NextResponse.json({
            searches: recentSearches,
            vehicles: activeVehicles,
            businesses: allBusinesses,
            stats: {
                topBrands: aggregate(recentSearches, 'brand'),
                topModels: aggregate(recentSearches, 'model'),
                topCategories: aggregate(recentSearches, 'category'),
                techTrends: {
                    transmissions: aggregate(recentSearches, 'transmission'),
                    fuels: aggregate(recentSearches, 'fuel'),
                    colors: aggregate(recentSearches, 'color'),
                }
            }
        })

    } catch (error) {
        console.error('Intelligence API error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
