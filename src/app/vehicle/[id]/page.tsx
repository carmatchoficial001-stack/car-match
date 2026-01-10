
import { Metadata } from 'next'
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import VehicleDetailClient from "./VehicleDetailClient"
import { auth } from '@/lib/auth'

interface Props {
    params: Promise<{
        id: string
    }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        }
    })

    if (!vehicle) {
        return {
            title: 'Vehículo no encontrado | CarMatch',
        }
    }

    const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model} - $${vehicle.price.toLocaleString()}`
    const description = `Mira este ${vehicle.brand} ${vehicle.model} en CarMatch. ${vehicle.description?.substring(0, 100)}...`

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: vehicle.images || [],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: vehicle.images || [],
        }
    }
}

export default async function VehicleDetailPage({ params }: Props) {
    const session = await auth()
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                    phone: true,
                    isAdmin: true
                }
            },
            _count: {
                select: {
                    favorites: true
                }
            },
            favorites: session?.user?.email ? {
                where: {
                    user: {
                        email: session.user.email
                    }
                },
                select: {
                    id: true
                }
            } : undefined
        }
    })

    if (!vehicle) {
        notFound()
    }

    // Calcular isAdmin correctamente (campo BD O verificar contra ADMIN_EMAIL)
    const vehicleData = {
        ...vehicle,
        price: vehicle.price.toNumber(),
        isFavorited: vehicle.favorites && vehicle.favorites.length > 0,
        features: vehicle.features || [],
        favorites: undefined,
        // Campos adicionales para gestión
        moderationStatus: vehicle.moderationStatus,
        moderationFeedback: vehicle.moderationFeedback,
        expiresAt: vehicle.expiresAt,
        isFreePublication: vehicle.isFreePublication,
        // IMPORTANTE: Calcular isAdmin correctamente
        user: {
            ...vehicle.user,
            isAdmin: vehicle.user.isAdmin || vehicle.user.email === process.env.ADMIN_EMAIL
        }
    }

    return (
        <VehicleDetailClient
            vehicle={vehicleData as any}
            currentUserEmail={session?.user?.email}
            currentUserId={session?.user?.id}
        />
    )
}
