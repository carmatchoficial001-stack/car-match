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
        select: { id: true }
    })

    if (!currentUser) {
        redirect("/auth")
    }


    // Obtener TODOS los vehículos ACTIVOS (sin filtrar por ciudad)
    // El filtrado por proximidad (12km) se hará en el cliente con GPS
    const vehicles = await prisma.vehicle.findMany({
        where: {
            status: "ACTIVE",
            userId: {
                not: currentUser.id // No mostrar propios vehículos
            },
            dislikes: {
                none: {
                    userId: currentUser.id
                }
            }
        },
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
                    image: true
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

    return (
        <SwipeClient
            initialVehicles={serializeDecimal(vehiclesWithFavoriteStatus) as any}
            currentUserId={currentUser.id}
        />
    )
}
