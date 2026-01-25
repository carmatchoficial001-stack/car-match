import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import BusinessDetailClient from './BusinessDetailClient'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { generateBusinessSlug } from '@/lib/slug'

interface Props {
    params: Promise<{ id: string }>
    searchParams?: Promise<any>
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

export default async function BusinessDetailPage({ params }: Props) {
    const { id } = await params
    const business = await prisma.business.findUnique({
        where: { id },
        select: { id: true, name: true, city: true }
    })

    if (!business) {
        notFound()
    }

    const slug = generateBusinessSlug(business.name, business.city)

    // 🚀 REDIRECCIÓN 301 (Business SEO Supremacy)
    permanentRedirect(`/negocio/${slug}-${business.id}`)
}
