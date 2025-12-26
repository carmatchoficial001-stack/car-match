import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import BusinessDetailClient from './BusinessDetailClient'
import { Metadata } from 'next'

interface Props {
    params: Promise<{ id: string }>
}

// Generar Metadata dinámica para SEO y Compartir en Redes (WhatsApp, Facebook, etc.)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const business = await prisma.business.findUnique({
        where: { id },
        select: { name: true, category: true, description: true, images: true }
    })

    if (!business) {
        return {
            title: 'Negocio no encontrado | CarMatch',
        }
    }

    return {
        title: `${business.name} | CarMatch MapStore`,
        description: business.description?.substring(0, 160) || `Encuentra ${business.name} y otros negocios de ${business.category} en CarMatch.`,
        openGraph: {
            title: `${business.name} - ${business.category}`,
            description: `¡Mira este negocio en CarMatch! Ubicación, horarios y contacto.`,
            images: business.images.length > 0 ? [business.images[0]] : [],
        },
    }
}

export default async function BusinessDetailPage({ params }: Props) {
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

    return <BusinessDetailClient business={business} />
}
