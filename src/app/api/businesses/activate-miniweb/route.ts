import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { businessId } = await request.json()

        if (!businessId) {
            return NextResponse.json({ error: 'ID de negocio requerido' }, { status: 400 })
        }

        // 1. Verificar propiedad y estado actual
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { id: true, userId: true, name: true, hasMiniWeb: true }
        })

        if (!business) {
            return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
        }

        if (business.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        if (business.hasMiniWeb) {
            return NextResponse.json({ error: 'La Mini-Web ya está activa para este negocio' }, { status: 400 })
        }

        // 2. Verificar créditos (PAGO ÚNICO: 20 CRÉDITOS)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        })

        if (!user || user.credits < 20) {
            return NextResponse.json({
                error: 'Créditos insuficientes',
                required: 20,
                current: user?.credits || 0
            }, { status: 402 })
        }

        // 3. Procesar activación con transacción
        await prisma.$transaction([
            // Descontar créditos
            prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: 20 } }
            }),
            // Activar Mini-Web
            prisma.business.update({
                where: { id: businessId },
                data: { hasMiniWeb: true }
            }),
            // Registrar transacción
            prisma.creditTransaction.create({
                data: {
                    userId: session.user.id,
                    amount: -20,
                    description: `Activación de Mini-Web Premium: ${business.name}`,
                    details: {
                        action: 'ACTIVATE_MINIWEB',
                        businessId,
                        businessName: business.name
                    }
                }
            })
        ])

        return NextResponse.json({
            success: true,
            message: '¡Mini-Web activada con éxito!',
            hasMiniWeb: true
        })

    } catch (error) {
        console.error('Error activating mini-web:', error)
        return NextResponse.json({ error: 'Error interno al activar Mini-Web' }, { status: 500 })
    }
}
