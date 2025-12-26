import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { renewBusinessForOneMonth } from '@/lib/businessMonetization'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params
        const businessId = id
        const body = await request.json()

        // Verificar que el negocio pertenece al usuario
        const business = await prisma.business.findUnique({
            where: { id: businessId }
        })

        if (!business) {
            return NextResponse.json(
                { error: 'Negocio no encontrado' },
                { status: 404 }
            )
        }

        if (business.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            )
        }

        // Si viene action: 'renew', renovar con crédito
        if (body.action === 'renew') {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { credits: true }
            })

            if (!user || user.credits < 1) {
                return NextResponse.json(
                    { error: 'Créditos insuficientes para renovar' },
                    { status: 402 }
                )
            }

            // Descontar crédito y renovar por 1 mes
            await prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: 1 } }
            })

            const newExpiresAt = renewBusinessForOneMonth(business.expiresAt)

            const updated = await prisma.business.update({
                where: { id: businessId },
                data: {
                    expiresAt: newExpiresAt,
                    isActive: true
                }
            })

            return NextResponse.json({
                business: updated,
                message: 'Negocio renovado por 1 mes más'
            })
        }

        // Actualización normal de datos
        const updated = await prisma.business.update({
            where: { id: businessId },
            data: {
                name: body.name !== undefined ? body.name.trim() : undefined,
                category: body.category,
                description: body.description !== undefined ? body.description?.trim() : undefined,
                address: body.address !== undefined ? body.address.trim() : undefined,
                phone: body.phone !== undefined ? body.phone?.trim() : undefined,
                hours: body.hours !== undefined ? body.hours?.trim() : undefined,
                latitude: body.latitude !== undefined ? parseFloat(body.latitude) : undefined,
                longitude: body.longitude !== undefined ? parseFloat(body.longitude) : undefined,
                images: body.images,
                isActive: body.isActive
            }
        })

        return NextResponse.json({ business: updated })

    } catch (error) {
        console.error('Error actualizando negocio:', error)
        return NextResponse.json(
            { error: 'Error al actualizar negocio' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params
        const businessId = id

        // Verificar propiedad
        const business = await prisma.business.findUnique({
            where: { id: businessId }
        })

        if (!business) {
            return NextResponse.json(
                { error: 'Negocio no encontrado' },
                { status: 404 }
            )
        }

        if (business.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            )
        }

        // Eliminar
        await prisma.business.delete({
            where: { id: businessId }
        })

        return NextResponse.json({
            message: 'Negocio eliminado exitosamente'
        })

    } catch (error) {
        console.error('Error eliminando negocio:', error)
        return NextResponse.json(
            { error: 'Error al eliminar negocio' },
            { status: 500 }
        )
    }
}
