import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/sos/[id]/locations - Obtener ubicaciones en tiempo real de ambos usuarios
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { id } = await params

        // Obtener la alerta SOS
        const sosAlert = await prisma.sOSAlert.findUnique({
            where: { id },
            include: {
                victim: {
                    select: {
                        id: true,
                        name: true,
                        lastLatitude: true,
                        lastLongitude: true,
                        lastLocationUpdate: true
                    }
                },
                counterpart: {
                    select: {
                        id: true,
                        name: true,
                        lastLatitude: true,
                        lastLongitude: true,
                        lastLocationUpdate: true
                    }
                }
            }
        })

        if (!sosAlert) {
            return NextResponse.json({ error: 'Alerta SOS no encontrada' }, { status: 404 })
        }

        // Verificar que el usuario tiene permiso (es la víctima, la contraparte, o el contacto de confianza)
        const victimData = await prisma.user.findUnique({
            where: { id: sosAlert.victimId },
            select: { trustedContactId: true }
        })

        const isAuthorized =
            session.user.id === sosAlert.victimId ||
            session.user.id === sosAlert.counterpartId ||
            session.user.id === victimData?.trustedContactId

        if (!isAuthorized) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Devolver las coordenadas actualizadas
        return NextResponse.json({
            alertId: sosAlert.id,
            status: sosAlert.status,
            victim: {
                id: sosAlert.victim.id,
                name: sosAlert.victim.name,
                lat: sosAlert.victim.lastLatitude,
                lng: sosAlert.victim.lastLongitude,
                lastUpdate: sosAlert.victim.lastLocationUpdate
            },
            counterpart: sosAlert.counterpart ? {
                id: sosAlert.counterpart.id,
                name: sosAlert.counterpart.name,
                lat: sosAlert.counterpart.lastLatitude,
                lng: sosAlert.counterpart.lastLongitude,
                lastUpdate: sosAlert.counterpart.lastLocationUpdate
            } : null,
            createdAt: sosAlert.createdAt
        })

    } catch (error) {
        console.error('Error obteniendo ubicaciones SOS:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
