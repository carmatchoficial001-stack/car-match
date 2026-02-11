// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

﻿import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import ProfileClient from "./ProfileClient"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect("/auth")
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
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
                reportsMade: {
                    include: {
                        vehicle: { select: { title: true } },
                        business: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
        })

        if (!user) {
            console.error(`❌ Usuario no encontrado en DB para el email: ${session.user.email}`)
            redirect("/auth")
        }

        // Determinar si el usuario actual es el dueño del perfil
        const isOwner = session.user.email === user.email

        // Filtrar y ordenar vehículos
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
                        price: typeof v.price === 'object' && v.price?.toNumber ? v.price.toNumber() : Number(v.price),
                        latitude: v.latitude,
                        longitude: v.longitude
                    }))
                }}
                isOwner={isOwner}
                vehiclesToShow={vehiclesToShow.map(v => ({
                    ...v,
                    price: typeof v.price === 'object' && v.price?.toNumber ? v.price.toNumber() : Number(v.price),
                    latitude: v.latitude,
                    longitude: v.longitude
                }))}
            />
        )
    } catch (error: any) {
        // ⚠️ IMPORTANTE: No capturar errores de redirección de Next.js
        if (error.digest?.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT') {
            throw error
        }

        console.error("🔥 Error crítico en ProfilePage:", error)

        try {
            await prisma.systemLog.create({
                data: {
                    level: "ERROR",
                    message: `ProfilePage Error: ${error.message || String(error)}`,
                    source: "ProfilePage",
                    metadata: {
                        stack: error.stack,
                        timestamp: new Date().toISOString()
                    }
                }
            })
        } catch (logError) {
            console.error("No se pudo guardar el log en DB:", logError)
        }

        throw error
    }
}

