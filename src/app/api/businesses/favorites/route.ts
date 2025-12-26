import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notifyRealFavorite } from '@/lib/realNotifications'

// Toggle favorito de negocio
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { businessId } = await request.json()

        if (!businessId) {
            return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 })
        }

        // Verificar si el negocio está activo
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { isActive: true }
        })

        if (!business) {
            return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
        }

        // Si el negocio está inactivo, no permitir agregar a favoritos
        if (!business.isActive) {
            return NextResponse.json({ error: 'Este negocio no está disponible' }, { status: 400 })
        }

        // Verificar si ya existe el favorito
        const existingFavorite = await prisma.businessFavorite.findUnique({
            where: {
                userId_businessId: {
                    userId: session.user.id,
                    businessId
                }
            }
        })

        if (existingFavorite) {
            // Eliminar favorito
            await prisma.businessFavorite.delete({
                where: { id: existingFavorite.id }
            })
            return NextResponse.json({ isFavorite: false })
        } else {
            // Crear favorito
            await prisma.businessFavorite.create({
                data: {
                    userId: session.user.id,
                    businessId
                }
            })

            // Notificar al dueño del negocio
            await notifyRealFavorite(session.user.id, businessId, 'business')

            return NextResponse.json({ isFavorite: true })
        }

    } catch (error) {
        console.error('Error toggling business favorite:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// Obtener favoritos del usuario
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const favorites = await prisma.businessFavorite.findMany({
            where: {
                userId: session.user.id,
                business: {
                    isActive: true // Solo mostrar favoritos activos
                }
            },
            include: {
                business: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(favorites)

    } catch (error) {
        console.error('Error fetching business favorites:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
