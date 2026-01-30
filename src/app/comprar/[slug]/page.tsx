import { Metadata } from 'next'
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import VehicleDetailClient from "../../vehicle/[id]/VehicleDetailClient"
import { auth } from '@/lib/auth'
import { serializeDecimal } from "@/lib/serialize"
import { generateVehicleSlug } from '@/lib/slug'
import { getBrandEntity } from '@/lib/entities'

interface Props {
    params: Promise<{ slug: string }>
    searchParams: Promise<any>
}

function extractIdFromSlug(slug: string) {
    const parts = slug.split('-')
    return parts[parts.length - 1]
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { slug } = await params
    const id = extractIdFromSlug(slug)

    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
    })

    if (!vehicle) {
        return { title: 'CarMatch' }
    }

    const title = `✓ ${vehicle.brand} ${vehicle.model} ${vehicle.year} en ${vehicle.city} | CarMatch®`
    const description = `Venta de ${vehicle.brand} ${vehicle.model} usado en ${vehicle.city}. Motor ${vehicle.engine}, ${vehicle.transmission}. Trato directo en CarMatch.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: vehicle.images.length > 0 ? [vehicle.images[0]] : [],
            url: `https://carmatchapp.net/comprar/${slug}`,
            siteName: 'CarMatch',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: vehicle.images.length > 0 ? [vehicle.images[0]] : [],
        },
        alternates: {
            canonical: `https://carmatchapp.net/comprar/${slug}`,
        }
    }
}

export default async function ComprarVehiclePage({ params, searchParams }: Props) {
    const { slug } = await params
    const id = extractIdFromSlug(slug)
    const session = await auth()

    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                    phone: true,
                    isAdmin: true
                }
            },
            _count: {
                select: {
                    favorites: true
                }
            },
            favorites: session?.user?.email ? {
                where: {
                    user: {
                        email: session.user.email
                    }
                },
                select: { id: true }
            } : {
                where: { id: 'none' },
                take: 0
            }
        }
    })

    if (!vehicle) {
        notFound()
    }

    const brandEntity = getBrandEntity(vehicle.brand)

    // 🚗 JSON-LD for AI and Google (Schema.org Car - Deep Technical + Entity Linking)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Car",
        "name": `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        "description": vehicle.description,
        "image": vehicle.images.map(img => ({
            "@type": "ImageObject",
            "url": img,
            "caption": `${vehicle.brand} ${vehicle.model} ${vehicle.year} en ${vehicle.city}`
        })),
        "brand": {
            "@id": brandEntity || undefined,
            "@type": "Brand",
            "name": vehicle.brand,
            "sameAs": brandEntity || undefined
        },
        "model": vehicle.model,
        "modelDate": vehicle.year,
        "color": vehicle.color,
        "vehicleTransmission": vehicle.transmission,
        "fuelType": vehicle.fuel,
        "vehicleEngine": {
            "@type": "EngineSpecification",
            "name": vehicle.engine,
        },
        "offers": {
            "@type": "Offer",
            "price": vehicle.price.toNumber(),
            "priceCurrency": vehicle.currency || "MXN",
            "availability": "https://schema.org/InStock",
            "url": `https://carmatchapp.net/comprar/${slug}`,
            "offeredBy": {
                "@type": "Organization",
                "name": "CarMatch",
                "url": "https://carmatchapp.net"
            }
        }
    }

    // 🤖 FAQ SCHEMA for AI Answers
    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `¿Cuál es el precio del ${vehicle.brand} ${vehicle.model} ${vehicle.year}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `El precio de este ${vehicle.brand} ${vehicle.model} es de $${vehicle.price.toLocaleString()} ${vehicle.currency}.`
                }
            }
        ]
    }

    // 🔗 BREADCRUMBS JSON-LD (Wikipedia Style Hierarchy)
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "CarMatch", "item": "https://carmatchapp.net" },
            { "@type": "ListItem", "position": 2, "name": "Comprar", "item": "https://carmatchapp.net/market" },
            { "@type": "ListItem", "position": 3, "name": vehicle.brand, "item": `https://carmatchapp.net/market?brand=${encodeURIComponent(vehicle.brand)}` },
            { "@type": "ListItem", "position": 4, "name": vehicle.model, "item": `https://carmatchapp.net/comprar/${slug}` }
        ]
    }

    // 🔄 RELATED VEHICLES
    const relatedVehicles = await prisma.vehicle.findMany({
        where: {
            AND: [
                { id: { not: vehicle.id } },
                { status: 'ACTIVE' },
                { OR: [{ brand: vehicle.brand }, { vehicleType: vehicle.vehicleType }] }
            ]
        },
        take: 6,
        select: { id: true, title: true, price: true, year: true, images: true, city: true }
    })

    const vehicleData = {
        ...vehicle,
        price: vehicle.price.toNumber(),
        isFavorited: vehicle.favorites && vehicle.favorites.length > 0,
        features: vehicle.features || [],
        favorites: undefined,
        user: {
            ...vehicle.user,
            isAdmin: vehicle.user.isAdmin || vehicle.user.email === process.env.ADMIN_EMAIL
        }
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <VehicleDetailClient
                vehicle={vehicleData as any}
                currentUserEmail={session?.user?.email}
                currentUserId={session?.user?.id}
                relatedVehicles={serializeDecimal(relatedVehicles)}
            />
        </>
    )
}

