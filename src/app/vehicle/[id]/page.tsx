import { Metadata } from 'next'
import { prisma } from "@/lib/db"
import { notFound, permanentRedirect } from "next/navigation"
import VehicleDetailClient from "./VehicleDetailClient"
import { auth } from '@/lib/auth'
import { serializeDecimal } from "@/lib/serialize"
import { generateVehicleSlug } from '@/lib/slug'

interface Props {
    params: Promise<{ id: string }>
    searchParams?: Promise<any>
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
            title: 'CarMatch',
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
        title: `${title} | ${vehicle.city} | CarMatch`,
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

export default async function VehicleDetailPage({ params }: Props) {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: { id: true, brand: true, model: true, year: true, city: true }
    })

    if (!vehicle) {
        notFound()
    }

    const slug = generateVehicleSlug(vehicle.brand, vehicle.model, vehicle.year, vehicle.city)

    // 🚀 REDIRECCIÓN 301 (Ultimate SEO Supremacy)
    permanentRedirect(`/comprar/${slug}-${vehicle.id}`)
}

