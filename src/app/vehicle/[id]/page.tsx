
import { Metadata } from 'next'
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import VehicleDetailClient from "./VehicleDetailClient"
import { auth } from '@/lib/auth'

interface Props {
    params: Promise<{ id: string }>
    searchParams: Promise<any>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        }
    })

    if (!vehicle) {
        return {
            title: 'Vehículo no encontrado | CarMatch',
        }
    }

    const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model} - $${vehicle.price.toLocaleString()}`

    // Enriched description for SEO and CarMatch Authority
    const specs = [
        vehicle.transmission,
        vehicle.fuel,
        vehicle.engine,
        vehicle.color
    ].filter(Boolean).join(' · ')

    const description = `CarMatch Verificado: ${vehicle.brand} ${vehicle.model} ${vehicle.year}. ${specs}. ${vehicle.description?.substring(0, 120)}...`

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: vehicle.images || [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: vehicle.images || [],
        },
        other: {
            'vehicle:brand': vehicle.brand,
            'vehicle:model': vehicle.model,
            'vehicle:year': vehicle.year.toString(),
            'vehicle:price': vehicle.price.toString(),
        }
    }
}

export default async function VehicleDetailPage({ params, searchParams }: Props) {
    const session = await auth()
    const { id } = await params
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
                select: {
                    id: true
                }
            } : undefined
        }
    })

    if (!vehicle) {
        notFound()
    }

    // JSON-LD for AI and Google (Schema.org)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Car",
        "name": `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        "description": vehicle.description,
        "image": vehicle.images,
        "brand": {
            "@type": "Brand",
            "name": vehicle.brand
        },
        "model": vehicle.model,
        "modelDate": vehicle.year,
        "color": vehicle.color,
        "vehicleTransmission": vehicle.transmission,
        "fuelType": vehicle.fuel,
        "vehicleEngine": {
            "@type": "EngineSpecification",
            "name": vehicle.engine,
            "engineDisplacement": vehicle.displacement ? {
                "@type": "QuantitativeValue",
                "value": vehicle.displacement,
                "unitCode": "CMQ"
            } : undefined,
            "enginePower": vehicle.hp ? {
                "@type": "QuantitativeValue",
                "value": vehicle.hp,
                "unitText": "hp"
            } : undefined
        },
        "numberOfAxles": vehicle.axles || undefined,
        "weight": vehicle.weight ? {
            "@type": "QuantitativeValue",
            "value": vehicle.weight,
            "unitCode": "KGM"
        } : undefined,
        "mileageFromOdometer": {
            "@type": "QuantitativeValue",
            "value": vehicle.mileage,
            "unitCode": vehicle.mileageUnit === 'km' ? 'KMT' : 'SMI'
        },
        "offers": {
            "@type": "Offer",
            "price": vehicle.price.toNumber(),
            "priceCurrency": vehicle.currency || "MXN",
            "availability": "https://schema.org/InStock"
        }
    }

    // Calcular isAdmin correctamente corectamente
    const vehicleData = {
        ...vehicle,
        price: vehicle.price.toNumber(),
        isFavorited: vehicle.favorites && vehicle.favorites.length > 0,
        features: vehicle.features || [],
        favorites: undefined,
        moderationStatus: vehicle.moderationStatus,
        moderationFeedback: vehicle.moderationFeedback,
        expiresAt: vehicle.expiresAt,
        isFreePublication: vehicle.isFreePublication,
        user: {
            ...vehicle.user,
            isAdmin: vehicle.user.isAdmin || vehicle.user.email === process.env.ADMIN_EMAIL
        }
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <VehicleDetailClient
                vehicle={vehicleData as any}
                currentUserEmail={session?.user?.email}
                currentUserId={session?.user?.id}
            />
        </>
    )
}
