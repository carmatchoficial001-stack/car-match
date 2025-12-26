import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { packageId } = body

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID requerido' }, { status: 400 })
        }

        // 1. Obtener detalles del paquete
        const creditPackage = await prisma.creditPackage.findUnique({
            where: { id: packageId }
        })

        if (!creditPackage) {
            return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // 2. Transacción: Registrar pago y sumar créditos
        // NOTA: En producción, esto se haría tras confirmar el webhook de Stripe
        // Aquí simulamos el éxito inmediato para el prototipo.
        const result = await prisma.$transaction(async (tx) => {
            // Crear registro de pago
            const payment = await tx.payment.create({
                data: {
                    userId: user.id,
                    amount: creditPackage.price,
                    currency: 'MXN',
                    status: 'COMPLETED',
                    paymentMethod: 'SIMULATOR',
                    creditsAdded: creditPackage.credits,
                    transactionId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`
                }
            })

            // Actualizar créditos del usuario
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    credits: {
                        increment: creditPackage.credits
                    }
                }
            })

            return { payment, newBalance: updatedUser.credits }
        })

        return NextResponse.json({
            success: true,
            message: 'Compra realizada con éxito',
            newBalance: result.newBalance,
            creditsAdded: creditPackage.credits
        })

    } catch (error) {
        console.error('Error en compra de créditos:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
