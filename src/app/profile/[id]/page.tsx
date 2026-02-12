// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

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
