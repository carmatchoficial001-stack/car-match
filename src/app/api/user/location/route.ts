// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST: Update my own location
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { latitude, longitude } = body

        if (!latitude || !longitude) {
            return new NextResponse('Missing coordinates', { status: 400 })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                lastLatitude: parseFloat(latitude),
                lastLongitude: parseFloat(longitude),
                lastLocationUpdate: new Date()
            }
        })

        // 🚀 REAL-TIME SOS UPDATE CHECK
        // Si el usuario está involucrado en una emergencia activa, emitir evento socket
        try {
            const activeAlert = await prisma.sOSAlert.findFirst({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { victimId: session.user.id },
                        { counterpartId: session.user.id }
                    ]
                },
                include: {
                    victim: { select: { id: true, name: true } },
                    counterpart: { select: { id: true, name: true } }
                }
            })

            if (activeAlert) {
                const io = (global as any).io
                if (io) {
                    const victimLat = activeAlert.victimId === session.user.id ? parseFloat(latitude) : activeAlert.victimLat
                    const victimLng = activeAlert.victimId === session.user.id ? parseFloat(longitude) : activeAlert.victimLng
                    const counterpartLat = activeAlert.counterpartId === session.user.id ? parseFloat(latitude) : activeAlert.counterpartLat
                    const counterpartLng = activeAlert.counterpartId === session.user.id ? parseFloat(longitude) : activeAlert.counterpartLng

                    // Update alert in DB as well to keep sync history
                    await prisma.sOSAlert.update({
                        where: { id: activeAlert.id },
                        data: {
                            victimLat,
                            victimLng,
                            counterpartLat,
                            counterpartLng,
                            updatedAt: new Date()
                        }
                    })

                    const payload = {
                        alertId: activeAlert.id,
                        status: activeAlert.status,
                        victim: {
                            id: activeAlert.victimId,
                            name: activeAlert.victim.name,
                            lat: victimLat,
                            lng: victimLng,
                            lastUpdate: new Date()
                        },
                        counterpart: activeAlert.counterpart ? {
                            id: activeAlert.counterpartId,
                            name: activeAlert.counterpart.name || 'Desconocido',
                            lat: counterpartLat,
                            lng: counterpartLng,
                            lastUpdate: new Date()
                        } : null,
                        createdAt: activeAlert.createdAt
                    }

                    io.to(`emergency:${activeAlert.id}`).emit('emergency-update', payload)
                    console.log(`✅ [SOCKET] Emitted emergency-update for user ${session.user.id} in alert ${activeAlert.id}`)
                }
            }
        } catch (e) {
            console.error('Error emitting location socket event:', e)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating location:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// GET: Get another user's location (Restricted)
export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const targetUserId = searchParams.get('targetId')

        if (!targetUserId) {
            return new NextResponse('Target ID required', { status: 400 })
        }

        // Security check: Ensure there is an active chat or appointment between these users
        // For strict security, we should check if there's an ACTIVE appointment.
        // For the purpose of this implementation (Safety Mode), we'll allow it if they have a chat history.
        const chatExists = await prisma.chat.findFirst({
            where: {
                OR: [
                    { buyerId: session.user.id, sellerId: targetUserId },
                    { sellerId: session.user.id, buyerId: targetUserId }
                ]
            }
        })

        if (!chatExists) {
            return new NextResponse('Forbidden: No relationship found', { status: 403 })
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                lastLatitude: true,
                lastLongitude: true,
                lastLocationUpdate: true,
                // Also return generic info for police report
                id: true,
                email: true, // Maybe useful for police
                name: true
            }
        })

        if (!targetUser) {
            return new NextResponse('User not found', { status: 404 })
        }

        return NextResponse.json(targetUser)
    } catch (error) {
        console.error('Error fetching location:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
