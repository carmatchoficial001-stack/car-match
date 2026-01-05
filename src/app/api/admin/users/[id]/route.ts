import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { isAdmin: true }
        })

        if (!admin?.isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { id } = await context.params
        const data = await request.json()
        const { isActive, isAdmin } = data

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(typeof isActive === 'boolean' && { isActive }),
                ...(typeof isAdmin === 'boolean' && { isAdmin })
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error admin patching user:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { isAdmin: true }
        })

        if (!admin?.isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { id } = await context.params

        // We probably shouldn't fully delete users if they have references, 
        // but for this MVP, let's delete them or deactivate them.
        // If we want total deletion:
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error admin deleting user:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
