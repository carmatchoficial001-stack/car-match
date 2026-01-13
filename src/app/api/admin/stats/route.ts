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
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            }),
            prisma.business.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } }
            })
        ])

        return NextResponse.json({
            users: {
                total: totalUsers,
                active: activeUsers,
                recent: recentUsers
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
            reports: recentReports
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
