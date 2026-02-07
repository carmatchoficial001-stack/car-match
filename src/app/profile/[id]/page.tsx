import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ProfileClient from "../ProfileClient"
import { notFound } from "next/navigation"

interface PublicProfilePageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<any>
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
    const { id } = await params
    const session = await auth()

    // Buscar al usuario por ID
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            vehicles: {
                orderBy: { createdAt: "asc" }, // 🛡️ Orden secuencial como se agregaron
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

    // 🛡️ Si es visitante, barajar aleatoriamente
    if (!isOwner) {
        vehiclesToShow = [...vehiclesToShow].sort(() => Math.random() - 0.5)
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
