import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/Header"
import FavoriteButton from "@/components/FavoriteButton"
import Link from "next/link"
import FavoritesClient from "./FavoritesClient"

export default async function FavoritesPage() {
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

    const favorites = await prisma.favorite.findMany({
        where: {
            userId: currentUser.id
        },
        include: {
            vehicle: {
                include: {
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
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    // Serializar Decimals a números planos para el componente cliente
    const serializedFavorites = favorites.map(fav => ({
        ...fav,
        vehicle: {
            ...fav.vehicle,
            price: Number(fav.vehicle.price),
            latitude: fav.vehicle.latitude ? Number(fav.vehicle.latitude) : null,
            longitude: fav.vehicle.longitude ? Number(fav.vehicle.longitude) : null,
        }
    }))

    return (
        <FavoritesClient favorites={serializedFavorites} />
    )
}
