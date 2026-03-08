// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { prisma } from "@/lib/db"
import { serializeDecimal } from "@/lib/serialize"
import MarketClient from "../../market/MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { auth } from "@/lib/auth"
import { Metadata } from 'next'

export async function generateMetadata({
    params,
    searchParams: _searchParams
}: {
    params: Promise<{ cityName: string }>,
    searchParams: Promise<any>
}): Promise<Metadata> {
    const { cityName } = await params
    const city = decodeURIComponent(cityName)
    const cityCapitalized = city.charAt(0).toUpperCase() + city.slice(1)
    const title = `Autos Usados en ${cityCapitalized} | Compra y Venta de Vehículos | CarMatch®`
    const description = `Explora el marketplace más grande de ${cityCapitalized}. Autos usados, motocicletas y maquinaria pesada con trato directo. ¡Compra o vende hoy mismo en CarMatch!`

    return {
        title,
        description,
        keywords: [
            `autos en ${city}`, `venta de autos ${city}`, `carros usados ${city}`,
            `motos en ${city}`, `John Deere ${city}`, `comprar auto ${city}`,
            `marketplace autos ${city}`, `autos baratos ${city}`, `seminuevos ${city}`
        ],
        alternates: {
            canonical: `https://carmatchapp.net/autos-en/${encodeURIComponent(city.toLowerCase())}`,
        },
        openGraph: {
            title,
            description,
            url: `https://carmatchapp.net/autos-en/${encodeURIComponent(city.toLowerCase())}`,
            siteName: 'CarMatch',
            type: 'website',
            images: [
                {
                    url: 'https://carmatchapp.net/og-market.png',
                    width: 1200,
                    height: 630,
                    alt: `Autos en venta en ${cityCapitalized} - CarMatch`,
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['https://carmatchapp.net/og-market.png'],
        },
    }
}

export default async function CityPage({
    params,
    searchParams: _searchParams
}: {
    params: Promise<{ cityName: string }>,
    searchParams: Promise<any>
}) {
    const { cityName } = await params
    const city = decodeURIComponent(cityName)
    const session = await auth()

    // 🔓 Wikipedia Mode: Guests allowed
    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, isAdmin: true }
        })
        : null

    const isAdmin = currentUser?.isAdmin || false
    const currentUserId = currentUser?.id || 'guest'

    // Obtener vehículos activos en esa ciudad
    const vehicles = await prisma.vehicle.findMany({
        where: {
            status: "ACTIVE",
            city: { contains: city, mode: 'insensitive' }
        },
        include: {
            user: {
                select: { name: true, image: true, isAdmin: true }
            },
            favorites: currentUser ? {
                where: { userId: currentUser.id },
                select: { id: true }
            } : {
                where: { id: 'none' },
                take: 0
            }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
    })

    const items = vehicles.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isFavorited: v.favorites.length > 0,
        isBoosted: v.user.isAdmin
    }))

    // Obtener opciones únicas para filtros
    const [brands, vehicleTypes, colors] = await Promise.all([
        getCachedBrands(),
        getCachedVehicleTypes(),
        getCachedColors()
    ])

    // 🔗 ITEM LIST SCHEMA (SEO Authority for City results)
    const itemListLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Vehículos disponibles en ${city}`,
        "description": `Listado de los mejores autos, motos y maquinaria pesada en venta en la ciudad de ${city}.`,
        "itemListElement": items.map((v, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `https://carmatchapp.net/comprar/${v.brand}-${v.model}-${v.year}-${v.city}-${v.id}`.toLowerCase(),
            "name": `${v.brand} ${v.model} ${v.year}`
        }))
    }

    // 🔗 BREADCRUMB SCHEMA
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "CarMatch", "item": "https://carmatchapp.net" },
            { "@type": "ListItem", "position": 2, "name": "Autos por Ciudad", "item": "https://carmatchapp.net/market" },
            { "@type": "ListItem", "position": 3, "name": `Autos en ${city}`, "item": `https://carmatchapp.net/autos-en/${encodeURIComponent(city.toLowerCase())}` }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <div className="pt-24 px-6 max-w-7xl mx-auto text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-black mb-2 text-text-primary uppercase tracking-tighter">
                    COMPRA Y VENTA EN <span className="text-primary-500">{city}</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl">
                    Los vehículos más buscados por la comunidad de CarMatch en {city}. Trato directo, sin comisiones.
                </p>
            </div>

            <MarketClient
                initialItems={serializeDecimal(items) as any}
                currentUserId={currentUserId}
                brands={brands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={{}}
            />
        </div>
    )
}
