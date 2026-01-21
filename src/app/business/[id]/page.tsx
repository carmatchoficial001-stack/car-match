import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import BusinessDetailClient from './BusinessDetailClient'
import { Metadata } from 'next'

interface Props {
    params: Promise<{ id: string }>
    searchParams: Promise<any>
}

// Generar Metadata dinámica para SEO y Compartir en Redes (WhatsApp, Facebook, etc.)
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { id } = await params
    const business = await prisma.business.findUnique({
        where: { id },
        select: { name: true, category: true, description: true, images: true, city: true }
    })

    if (!business) {
        return {
            title: 'Negocio no encontrado | CarMatch',
        }
    }

    const title = `${business.name} | ${business.category.charAt(0).toUpperCase() + business.category.slice(1).toLowerCase()} en ${business.city}`

    return {
        title: `${title} | CarMatch`,
        description: business.description?.substring(0, 160) || `Encuentra ${business.name} en ${business.city}. Servicios de ${business.category} verificados en el MapStore de CarMatch.`,
        openGraph: {
            title: title,
            description: `¡Mira este negocio en CarMatch! Ubicación, horarios y servicios en ${business.city}.`,
            images: business.images.length > 0 ? [business.images[0]] : [],
        },
    }
}

import { auth } from '@/lib/auth'

export default async function BusinessDetailPage({ params, searchParams }: Props) {
    const { id } = await params

    // Fetch business data
    const business = await prisma.business.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        }
    })

    if (!business) {
        notFound()
    }

    // JSON-LD para Google e IAs (Mapeo Inteligente por Categoría)
    const getSchemaType = (cat: string) => {
        const repair = ['mecanico', 'frenos', 'suspension', 'aire_acondicionado', 'inyectores', 'transmisiones', 'radiadores', 'rectificadora', 'diesel', 'electrico'];
        const body = ['hojalateria', 'polarizado', 'rotulacion', 'blindaje'];
        const parts = ['refacciones', 'audio', 'iluminacion', 'llantera', 'cristales', 'mofles', 'performance', 'motos', 'yonke', 'importadoras'];
        const wash = ['estetica', 'detallado'];

        if (cat === 'gasolinera') return "GasStation";
        if (repair.includes(cat)) return "AutoRepair";
        if (body.includes(cat)) return "AutoBodyShop";
        if (parts.includes(cat)) return "AutoPartsStore";
        if (wash.includes(cat)) return "AutoWash";
        if (cat === 'estacionamiento') return "ParkingFacility";
        return "LocalBusiness";
    };

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": getSchemaType(business.category),
        "name": business.name,
        "description": business.description || `Servicio profesional de ${business.category} en ${business.city}.`,
        "image": business.images.length > 0 ? business.images[0] : undefined,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": business.address,
            "addressLocality": business.city,
            "addressRegion": business.state || undefined,
            "addressCountry": business.country || "MX"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": business.latitude,
            "longitude": business.longitude
        },
        "url": `https://carmatchapp.net/business/${business.id}`,
        "telephone": business.phone || undefined
    }

    // Obtener sesión para saber si es el dueño
    const session = await auth()

    const safeBusiness = {
        ...business,
        user: {
            ...business.user,
            name: business.user.name || 'Usuario CarMatch',
            image: business.user.image || ''
        },
        // Campos para gestión
        isActive: business.isActive,
        expiresAt: business.expiresAt,
        userId: business.userId,
        isFreePublication: business.isFreePublication
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BusinessDetailClient
                business={safeBusiness as any}
                currentUserId={session?.user?.id}
            />
        </>
    )
}
