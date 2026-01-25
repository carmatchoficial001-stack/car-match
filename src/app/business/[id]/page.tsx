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

