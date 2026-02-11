// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

// 🔒 FEATURE LOCKED: CARMATCH SWIPE. DO NOT EDIT WITHOUT EXPLICIT USER OVERRIDE.
export const dynamic = 'force-dynamic'

import { auth } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db"
import SwipeClient from "./SwipeClient"
import { serializeDecimal } from "@/lib/serialize"

// 🎯 SEO METADATA (Safe to edit - No afecta lógica locked)
export const metadata = {
    title: "CarMatch",
    description: "Desliza para descubrir tu próximo auto. Like para guardar en favoritos, Dislike para ocultar. La forma más rápida y divertida de explorar autos usados, camionetas, motos y más en México.",
    keywords: [
        "swipe autos", "tinder de carros", "descubrir autos", "feed de vehiculos",
        "like autos", "guardar favoritos carros", "explorar autos usados",
        "app deslizar carros", "encontrar auto rapido", "swipe vehiculos mexico",
        "carros en venta swipe", "marketplace dinámico autos", "feed interactivo vehiculos"
    ],
    openGraph: {
        title: "CarMatch Swipe | Descubre Tu Auto Ideal Deslizando",
        description: "La experiencia tipo Tinder para encontrar autos. Desliza, da Like y guarda tus favoritos al instante. Miles de vehículos esperándote.",
        url: "https://carmatchapp.net/swipe",
        images: ["/icon-512-v19.png"]
    }
}

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
    // 🔥 REGLA: El usuario puede ver sus propios vehículos en el deslizamiento
    // para asegurar que su publicación está "Viva" en el sistema.


    const vehicles = await prisma.vehicle.findMany({
        where: vehiclesWhere,
        select: {
            id: true,
            userId: true,  // 🆕 Needed to track ownership
            title: true,
            brand: true,
            model: true,
            year: true,
            price: true,
            city: true,
            latitude: true,
            longitude: true,
            country: true,
            description: true, // ✅ Fetched for swipe card details
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
