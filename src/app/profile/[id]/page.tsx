import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ProfileClient from "../ProfileClient"
import { notFound } from "next/navigation"

interface PublicProfilePageProps {
    params: {
        id: string
    }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
    const { id } = params
    const session = await auth()

    // Buscar al usuario por ID
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            vehicles: {
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    vehicles: true,
                    businesses: true,
                    favorites: true,
                },
            },
        },
    })

    if (!user) {
        return notFound()
    }

    // Determinar si el usuario actual es el dueño del perfil
    const isOwner = session?.user?.email === user.email

    // Filtrar vehículos: El visitante solo ve los ACTIVOS
    let vehiclesToShow = isOwner
        ? user.vehicles
        : user.vehicles.filter(v => v.status === "ACTIVE")

    // Si es el dueño, ordenar por estado: ACTIVE → INACTIVE → SOLD
    if (isOwner) {
        vehiclesToShow = [...vehiclesToShow].sort((a, b) => {
            const statusOrder = { ACTIVE: 0, INACTIVE: 1, SOLD: 2 }
            return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
        })
    }

    return (
        <ProfileClient
            user={{
                ...user,
                vehicles: user.vehicles.map(v => ({
                    ...v,
                    price: v.price.toNumber(),
                    latitude: v.latitude,
                    longitude: v.longitude
                }))
            }}
            isOwner={isOwner}
            vehiclesToShow={vehiclesToShow.map(v => ({
                ...v,
                price: v.price.toNumber(),
                latitude: v.latitude,
                longitude: v.longitude
            }))}
        />
    )
}
