import { prisma } from "@/lib/db"
import { Metadata } from 'next'
import { notFound } from "next/navigation"
import BusinessDetailClient from "../../business/[id]/BusinessDetailClient"
import { auth } from '@/lib/auth'
import { generateBusinessSlug } from '@/lib/slug'
import { getBrandEntity } from '@/lib/entities'

interface Props {
    params: Promise<{ slug: string }>
}

function extractIdFromSlug(slug: string) {
    const parts = slug.split('-')
    return parts[parts.length - 1]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const id = extractIdFromSlug(slug)

    const business = await prisma.business.findUnique({
        where: { id },
        select: { name: true, category: true, city: true, description: true, images: true }
    })

    if (!business) {
        return { title: 'Negocio no encontrado' }
    }

    const title = `✓ ${business.name} | ${business.category} en ${business.city} | CarMatch`
    const description = business.description || `Contacta a ${business.name} en ${business.city}. Servicios de ${business.category} verificados en CarMatch.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: business.images.length > 0 ? [business.images[0]] : [],
            url: `https://carmatchapp.net/negocio/${slug}`,
            siteName: 'CarMatch',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: business.images.length > 0 ? [business.images[0]] : [],
        },
        alternates: {
            canonical: `https://carmatchapp.net/negocio/${slug}`,
        }
    }
}

export default async function SemanticBusinessPage({ params }: Props) {
    const { slug } = await params
    const id = extractIdFromSlug(slug)
    const session = await auth()

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
        const wash = ['estetica', 'detallado'];
        if (repair.includes(cat)) return "AutoRepair";
        if (wash.includes(cat)) return "AutoWash";
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
        "url": `https://carmatchapp.net/negocio/${slug}`,
        "telephone": business.phone || undefined,
        "sameAs": getBrandEntity(business.name) || undefined // Si el negocio es una marca (ej: Toyota Juarez)
    }

    // 🤖 FAQ SCHEMA for AI Answers (Direct indexing for LLMs - Business Edition)
    const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `¿Qué servicios ofrece ${business.name}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `${business.name} es un especialista en ${business.category} ubicado en ${business.city}. ${business.description || ''}`
                }
            },
            {
                "@type": "Question",
                "name": `¿Cuál es la dirección de ${business.name}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Se encuentra ubicado en ${business.address}, ${business.city}, ${business.state || 'México'}.`
                }
            }
        ]
    }

    // 🔗 BREADCRUMBS JSON-LD (Hierarchy Authority)
    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "CarMatch", "item": "https://carmatchapp.net" },
            { "@type": "ListItem", "position": 2, "name": "MapStore", "item": "https://carmatchapp.net/map-store" },
            { "@type": "ListItem", "position": 3, "name": business.city, "item": `https://carmatchapp.net/map-store?city=${encodeURIComponent(business.city)}` },
            { "@type": "ListItem", "position": 4, "name": business.name, "item": `https://carmatchapp.net/negocio/${slug}` }
        ]
    }

    const safeBusiness = {
        ...business,
        user: {
            ...business.user,
            name: business.user.name || 'Usuario CarMatch',
            image: business.user.image || ''
        }
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <BusinessDetailClient
                business={safeBusiness as any}
                currentUserId={session?.user?.id}
            />
        </>
    )
}
