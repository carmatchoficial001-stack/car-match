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
        const statsResults = await Promise.all([
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
                    vehicle: { select: { id: true, title: true } },
                    business: { select: { id: true, name: true } }
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

            // 📊 13+ Nuevas Métricas
            prisma.analyticsEvent.count({ where: { eventType: 'SHARE' } }), // 13
            prisma.user.count({ where: { vehicles: { none: {} }, businesses: { none: {} } } }), // 14
            prisma.vehicle.count({ where: { isFreePublication: true } }), // 15
            prisma.vehicle.count({ where: { isFreePublication: false } }), // 16
            prisma.business.count({ where: { isFreePublication: true } }), // 17
            prisma.business.count({ where: { isFreePublication: false } }), // 18
            prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { creditsAdded: true, amount: true } }), // 19
            prisma.creditTransaction.aggregate({ where: { amount: { lt: 0 } }, _sum: { amount: true } }), // 20
            prisma.business.count({ where: { isActive: true } }), // 21
            prisma.sOSAlert.count() // 22
        ])

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
            recentBusinesses,
            shareCount,
            buyerCount,
            freeVehicles,
            paidVehicles,
            freeBusinesses,
            paidBusinesses,
            paymentSummary,
            usageSummary,
            activeBusinesses,
            sosCount
        ] = statsResults

        const creditsPurchased = paymentSummary?._sum?.creditsAdded || 0
        const totalRevenue = Number(paymentSummary?._sum?.amount || 0)
        const creditsUsed = Math.abs(Number(usageSummary?._sum?.amount || 0))

        // 🧠 Intelligence Processing
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
            revenue: generateTrend(totalRevenue, 14)
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
                totalRevenue: totalRevenue
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
