import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 🛡️ Admin Check Master (ENV or DB)
        const isAdminMaster = session.user.email === process.env.ADMIN_EMAIL

        if (!isAdminMaster) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { isAdmin: true }
            })

            if (!user?.isAdmin) {
                return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
            }
        }

        // Fetch system statistics
        const [
            totalUsers,
            activeUsers,
            totalVehicles,
            activeVehicles,
            totalBusinesses,
            totalChats,
            totalAppointments,
            activeAppointments,
            recentLogs,
            recentReports,
            recentUsers,
            recentVehicles,
            recentBusinesses
        ] = await Promise.all([
            // 0-4: Basic Counts
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.vehicle.count(),
            prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
            prisma.business.count(),

            // 5-7: Chats/Appointments
            prisma.chat.count(),
            prisma.appointment.count(),
            prisma.appointment.count({ where: { status: 'ACCEPTED' } }),

            // 8-12: Lists (Recent Items)
            prisma.systemLog.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.report.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: { select: { name: true, email: true } },
                    targetUser: { select: { name: true, email: true } },
                    vehicle: { select: { title: true } },
                }
            }),
            prisma.user.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, image: true, isAdmin: true, isActive: true, createdAt: true, credits: true }
            }),
            prisma.vehicle.findMany({
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            }),
            prisma.business.findMany({
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            }),

            // 📊 13+ Nuevas Métricas (Appended to avoid shifting indices)
            // 13. Compartidos
            prisma.analyticsEvent.count({ where: { eventType: 'SHARE' } }),

            // 14. Compradores
            prisma.user.count({
                where: {
                    vehicles: { none: {} },
                    businesses: { none: {} }
                }
            }),

            // 15-16. Vehículos (Gratis/Paid)
            prisma.vehicle.count({ where: { isFreePublication: true } }),
            prisma.vehicle.count({ where: { isFreePublication: false } }),

            // 17-18. Negocios (Gratis/Paid)
            prisma.business.count({ where: { isFreePublication: true } }),
            prisma.business.count({ where: { isFreePublication: false } }),

            // 19-20. Créditos
            prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { creditsAdded: true } }),
            prisma.creditTransaction.aggregate({ where: { amount: { lt: 0 } }, _sum: { amount: true } }),

            // 21. Negocios Activos
            prisma.business.count({ where: { isActive: true } }),

            // 22. SOS Count
            prisma.sOSAlert.count()
        ])

        // Destructure new metrics (indices based on order above)
        const shareCount = arguments[13] || 0
        const buyerCount = arguments[14] || 0
        const freeVehicles = arguments[15] || 0
        const paidVehicles = arguments[16] || 0
        const freeBusinesses = arguments[17] || 0
        const paidBusinesses = arguments[18] || 0
        const creditsPurchased = arguments[19]?._sum?.creditsAdded || 0
        const creditsUsed = Math.abs(arguments[20]?._sum?.amount || 0)
        const activeBusinesses = arguments[21] || 0
        const sosCount = arguments[22] || 0

        // 🧠 Intelligence Processing
        // Extract Coordinates for Heatmap
        const intelligence = {
            searches: [] as any[],
            vehicles: recentVehicles
                .filter(v => v.latitude && v.longitude)
                .map(v => ({ latitude: v.latitude, longitude: v.longitude, title: v.title })),
            businesses: recentBusinesses
                .filter(b => b.latitude && b.longitude)
                .map(b => ({ latitude: b.latitude, longitude: b.longitude, name: b.name, category: b.category }))
        }

        // Mock Growth Data
        const generateTrend = (total: number, days: number) => {
            let current = Math.floor(total * 0.6)
            const data = []
            for (let i = 0; i < days; i++) {
                const increment = Math.floor(Math.random() * (total * 0.05))
                current = Math.min(total, current + increment)
                data.push(current)
            }
            return data
        }

        const growth = {
            users: generateTrend(totalUsers, 14),
            revenue: generateTrend(totalUsers * 10, 14)
        }

        return NextResponse.json({
            users: {
                total: totalUsers,
                active: activeUsers,
                recent: recentUsers,
                growth: growth.users
            },
            vehicles: {
                total: totalVehicles,
                active: activeVehicles,
                recent: recentVehicles
            },
            businesses: {
                total: totalBusinesses,
                recent: recentBusinesses
            },
            chats: {
                total: totalChats
            },
            appointments: {
                total: totalAppointments,
                active: activeAppointments
            },
            logs: recentLogs,
            reports: recentReports,
            intelligence: intelligence,
            financials: {
                revenue: growth.revenue,
                totalRevenue: totalUsers * 15
            },
            detailedStats: {
                shareCount,
                buyerCount,
                sellerCount: activeUsers - buyerCount,
                sosCount, // 🚨 New Metric
                vehicleStats: {
                    free: freeVehicles,
                    paid: paidVehicles,
                    active: activeVehicles,
                    inactive: totalVehicles - activeVehicles,
                    total: totalVehicles
                },
                businessStats: {
                    free: freeBusinesses,
                    paid: paidBusinesses,
                    active: activeBusinesses, // 🚨 New Metric
                    inactive: totalBusinesses - activeBusinesses,
                    total: totalBusinesses
                },
                creditStats: {
                    purchased: creditsPurchased,
                    used: creditsUsed,
                    activeInCirculation: creditsPurchased - creditsUsed
                }
            }
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
