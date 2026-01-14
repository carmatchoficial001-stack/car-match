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
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.vehicle.count(),
            prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
            prisma.business.count(),
            prisma.chat.count(),
            prisma.appointment.count(),
            prisma.appointment.count({ where: { status: 'ACCEPTED' } }),
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
                take: 100, // Increased for Heatmap
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } } // Need lat/lng if available? 
                // Assuming vehicles have latitude/longitude. Let's select them explicitly.
            }),
            prisma.business.findMany({
                take: 100, // Increased for Heatmap
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            })
        ])

        // 🧠 Intelligence Processing
        // Extract Coordinates for Heatmap
        const intelligence = {
            searches: [] as any[], // Future: Real searches
            vehicles: recentVehicles
                .filter(v => v.latitude && v.longitude)
                .map(v => ({ latitude: v.latitude, longitude: v.longitude, title: v.title })),
            businesses: recentBusinesses
                .filter(b => b.latitude && b.longitude)
                .map(b => ({ latitude: b.latitude, longitude: b.longitude, name: b.name, category: b.category }))
        }

        // Mock Growth Data (for Chart) - In a real app, use groupBy date
        // Generating a consistent "fake" growth curve based on total count for visualization
        const generateTrend = (total: number, days: number) => {
            let current = Math.floor(total * 0.6) // Start at 60%
            const data = []
            for (let i = 0; i < days; i++) {
                // Add random noise + trend
                const increment = Math.floor(Math.random() * (total * 0.05))
                current = Math.min(total, current + increment)
                data.push(current)
            }
            return data
        }

        const growth = {
            users: generateTrend(totalUsers, 14),
            revenue: generateTrend(totalUsers * 10, 14) // Mock revenue based on users
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
            intelligence: intelligence, // New Geo Data
            financials: {
                revenue: growth.revenue,
                totalRevenue: totalUsers * 15 // Mock total
            }
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
