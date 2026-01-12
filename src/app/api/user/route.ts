import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const data = await request.json()
        const { name, image, trustedContactId } = data

        if (!name && !image) {
            return NextResponse.json({ error: 'No se proporcionaron datos para actualizar' }, { status: 400 })
        }

        // Buscar el usuario por email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Actualizar usuario
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                ...(name && { name }),
                ...(image && { image }),
                trustedContactId: trustedContactId === "" ? null : (trustedContactId || undefined)
            }
        })

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.error('Error actualizando perfil:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
