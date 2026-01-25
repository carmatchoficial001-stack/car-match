import { prisma } from "@/lib/db"
import { Metadata } from 'next'
import MarketClient from "../../../market/MarketClient"
import { getCachedBrands, getCachedVehicleTypes, getCachedColors } from "@/lib/cached-data"
import { serializeDecimal } from "@/lib/serialize"
import { auth } from "@/lib/auth"

interface Props {
    params: Promise<{ tag: string }>
}

const CLUSTERS: Record<string, { title: string, query: any, desc: string }> = {
    '4x4-todo-terreno': {
        title: 'Vehículos 4x4 y Todo Terreno',
        query: { traction: { contains: '4x4', mode: 'insensitive' } },
        desc: 'Explora nuestra selección de camionetas y autos con tracción 4x4. Listos para la aventura y el trabajo pesado.'
    },
    'electricos-y-hibridos': {
        title: 'Autos Eléctricos e Híbridos',
        query: { fuel: { in: ['Eléctrico (BEV)', 'Híbrido (HEV)', 'Híbrido Enchufable (PHEV)'] } },
        desc: 'El futuro es hoy. Encuentra los mejores autos eléctricos e híbridos para ahorrar combustible y cuidar el planeta.'
    },
    'blindados-seguridad': {
        title: 'Vehículos Blindados y Seguridad',
        query: {
            OR: [
                { vehicleType: { contains: 'Blindado', mode: 'insensitive' } },
                { description: { contains: 'blindaje', mode: 'insensitive' } },
                { description: { contains: 'blindado', mode: 'insensitive' } }
            ]
        },
        desc: 'Máxima protección para ti y tu familia. Catálogo de vehículos con blindaje certificado y equipo de seguridad.'
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { tag } = await params
    const cluster = CLUSTERS[tag]
    if (!cluster) return { title: 'Catálogo de Autos | CarMatch' }

    return {
        title: `✓ ${cluster.title} en Venta en México | CarMatch®`,
        description: cluster.desc,
        keywords: [tag, 'venta de autos', 'precios de vehiculos mexico']
    }
}

export default async function ClusterPage({ params }: Props) {
    const { tag } = await params
    const cluster = CLUSTERS[tag]
    const session = await auth()

    if (!cluster) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold">Catálogo no encontrado</h1>
            </div>
        )
    }

    const currentUser = session?.user?.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })
        : null

    const currentUserId = currentUser?.id || 'guest'

    const vehicles = await prisma.vehicle.findMany({
        where: {
            status: "ACTIVE",
            ...cluster.query
        },
        include: {
            user: { select: { name: true, image: true, isAdmin: true } },
            favorites: currentUser ? {
                where: { userId: currentUser.id },
                select: { id: true }
            } : { where: { id: 'none' }, take: 0 }
        },
        take: 40,
        orderBy: { createdAt: 'desc' }
    })

    const items = vehicles.map(v => ({
        ...v,
        feedType: 'VEHICLE' as const,
        isFavorited: v.favorites.length > 0,
        isBoosted: v.user.isAdmin
    }))

    const [allBrands, vehicleTypes, colors] = await Promise.all([
        getCachedBrands(),
        getCachedVehicleTypes(),
        getCachedColors()
    ])

    return (
        <div className="min-h-screen bg-background">
            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black mb-2 text-text-primary uppercase tracking-tighter">
                    {cluster.title.split(' ')[0]} <span className="text-primary-500">{cluster.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl">
                    {cluster.desc}
                </p>
            </div>

            <MarketClient
                initialItems={serializeDecimal(items) as any}
                currentUserId={currentUserId}
                brands={allBrands}
                vehicleTypes={vehicleTypes}
                colors={colors}
                searchParams={{}} // Filtros ya aplicados en la consulta inicial
            />
        </div>
    )
}
