import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true }
        })

        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
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
            recentLogs
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
            })
        ])

        return NextResponse.json({
            users: {
                total: totalUsers,
                active: activeUsers
            },
            vehicles: {
                total: totalVehicles,
                active: activeVehicles
            },
            businesses: {
                total: totalBusinesses
            },
            chats: {
                total: totalChats
            },
            appointments: {
                total: totalAppointments,
                active: activeAppointments
            },
            logs: recentLogs
        })
    } catch (error) {
        console.error('Error fetching admin stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
