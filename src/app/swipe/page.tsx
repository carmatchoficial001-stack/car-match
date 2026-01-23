// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import SwipeClient from "./SwipeClient"
import { serializeDecimal } from "@/lib/serialize"

export default async function SwipePage() {
    const session = await auth()
    const cookieStore = await cookies()
    const isSoftLogout = cookieStore.get('soft_logout')?.value === 'true'

    const currentUser = session?.user?.email

        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true }
        })
        : null

    const currentUserId = currentUser?.id || 'guest'
    const isAdmin = currentUser?.isAdmin || currentUser?.id === process.env.ADMIN_EMAIL

    // Obtener vehículos ACTIVOS
    const vehiclesWhere: any = {
        status: "ACTIVE",
    }

    // Si hay usuario, excluir lo que ya le dio dislike
    if (currentUser) {
        vehiclesWhere.dislikes = {
            none: {
                userId: currentUser.id
            }
        }
    }

    // Si NO es admin y hay usuario, ocultar propios. Invitados ven todo.
    // 🔥 NEW: En Modo Invitado (soft_logout) sí permitimos ver sus propios vehículos
    if (!isAdmin && currentUser && !isSoftLogout) {
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
            favorites: currentUser ? {
                where: {
                    userId: currentUser.id
                },
                select: {
                    id: true
                }
            } : {
                where: { id: 'none' },
                take: 0
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

    const items = vehiclesWithFavoriteStatus.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isBoosted: v.user.isAdmin
    }))

    return (
        <SwipeClient
            initialItems={serializeDecimal(items) as any}
            currentUserId={currentUserId}
        />
    )
}
