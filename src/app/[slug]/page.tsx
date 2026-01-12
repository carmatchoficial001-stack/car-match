import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import MiniWebClient from './MiniWebClient'

interface Props {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params

    // Lista de rutas reservadas que NO deben confundirse con slugs de negocios
    const reservedRoutes = ['market', 'swipe', 'map', 'map-store', 'profile', 'credits', 'publish', 'auth', 'api', 'admin', 'messages', 'notifications', 'my-businesses', 'favorites', 'terms', 'privacy']

    if (reservedRoutes.includes(slug)) {
        return {}
    }

    const business = await prisma.business.findUnique({
        where: { slug },
        select: { name: true, category: true, description: true, images: true, city: true }
    })

    if (!business) {
        return {
            title: 'Negocio no encontrado | CarMatch',
        }
    }

    return {
        title: `${business.name} | Sitio Oficial en CarMatch`,
        description: business.description?.substring(0, 160) || `Visita el sitio oficial de ${business.name} en ${business.city}. Servicios de ${business.category}.`,
        openGraph: {
            title: business.name,
            description: business.description?.substring(0, 100) || `Explora ${business.name} en CarMatch.`,
            images: business.images.length > 0 ? [business.images[0]] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: business.name,
            description: business.description?.substring(0, 100),
            images: business.images.length > 0 ? [business.images[0]] : [],
        }
    }
}

export default async function MiniWebPage({ params }: Props) {
    const { slug } = await params

    // 1. Evitar colisión con rutas estáticas (aunque Next.js ya prioriza, por seguridad)
    const reservedRoutes = ['market', 'swipe', 'map', 'map-store', 'profile', 'credits', 'publish', 'auth', 'api', 'admin', 'messages', 'notifications', 'my-businesses', 'favorites', 'terms', 'privacy']
    if (reservedRoutes.includes(slug)) {
        notFound()
    }

    // 2. Buscar negocio por slug
    const business = await prisma.business.findUnique({
        where: { slug },
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        }
    })

    // 3. Validaciones
    if (!business) {
        notFound()
    }

    // 4. Si tiene slug pero NO ha activado Mini-Web, redirigir a la vista estándar
    if (!business.hasMiniWeb) {
        redirect(`/business/${business.id}`)
    }

    return (
        <MiniWebClient business={business as any} />
    )
}
