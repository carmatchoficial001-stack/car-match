// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import SwipeClient from "./SwipeClient"
import { serializeDecimal } from "@/lib/serialize"

export default async function SwipePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/auth")
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, isAdmin: true }
    })

    if (!currentUser) {
        redirect("/auth")
    }

    const isAdmin = currentUser.isAdmin || currentUser.id === process.env.ADMIN_EMAIL

    // Obtener vehículos ACTIVOS
    const vehiclesWhere: any = {
        status: "ACTIVE",
        dislikes: {
            none: {
                userId: currentUser.id
            }
        }
    }

    // Si NO es admin, ocultar propios
    if (!isAdmin) {
        vehiclesWhere.userId = {
            not: currentUser.id
        }
    }

    const vehicles = await prisma.vehicle.findMany({
        where: vehiclesWhere,
        select: {
            id: true,
            title: true,
            brand: true,
            model: true,
            year: true,
            price: true,
            city: true,
            latitude: true,
            longitude: true,
            country: true,
            images: true,
            user: {
                select: {
                    name: true,
                    image: true,
                    isAdmin: true
                }
            },
            _count: {
                select: {
                    favorites: true
                }
            },
            favorites: {
                where: {
                    userId: currentUser.id
                },
                select: {
                    id: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    const vehiclesWithFavoriteStatus = vehicles.map(vehicle => ({
        ...vehicle,
        isFavorited: vehicle.favorites.length > 0,
        favorites: undefined // Remove the array to keep payload clean
    }))

    // Obtener SOLO negocios de administradores para inyectar en el feed (exclusividad solicitada)
    const businesses = await prisma.business.findMany({
        where: {
            isActive: true,
            user: {
                isAdmin: true
            }
        },
        select: {
            id: true,
            name: true,
            category: true,
            city: true,
            latitude: true,
            longitude: true,
            images: true,
            country: true,
            user: {
                select: {
                    name: true,
                    image: true,
                    isAdmin: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    const itemsWithBoost = [
        ...vehiclesWithFavoriteStatus.map(v => ({
            ...v,
            feedType: 'VEHICLE' as const,
            isBoosted: v.user.isAdmin
        })),
        ...businesses.map(b => ({
            ...b,
            title: b.name,
            feedType: 'BUSINESS' as const,
            isBoosted: true
        }))
    ]

    return (
        <SwipeClient
            initialItems={serializeDecimal(itemsWithBoost) as any}
            currentUserId={currentUser.id}
        />
    )
}
