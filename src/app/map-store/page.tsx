import { prisma } from '@/lib/db'
import MapClient from '../map/MapClient'
import { auth } from '@/lib/auth'
import { serializeDecimal } from '@/lib/serialize'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: "MapStore | Servicios Automotrices 24/7 y Emergencias Mecánicas",
    description: "Servicios automotrices 24/7 con servicio a domicilio. Localiza mecánicos, desponchadoras, refaccionarias con entrega y auxilio vial inmediato en Juárez y todo México. CarMatch te salva en el camino.",
    keywords: [
        "servicio a domicilio", "mecánico a domicilio Juárez", "refacciones a domicilio",
        "desponchadora a domicilio", "lavado de autos a domicilio", "servicio 24/7",
        "emergencia mecánica", "auxilio vial", "grúas 24 horas", "entrega de batería",
        "mecánico express", "reparación en sitio", "mantenimiento en casa", "CarMatch"
    ]
}

export default async function MapStorePage({ searchParams }: { searchParams: any }) {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
    })

    if (!user) {
        redirect('/auth')
    }

    // Fetch active businesses OR businesses owned by the current user (even if inactive)
    let whereCondition: any = {
        isActive: true
    }

    if (user?.id) {
        whereCondition = {
            OR: [
                { isActive: true },
                { userId: user.id }
            ]
        }
    }

    const businesses = await prisma.business.findMany({
        where: whereCondition,
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            }
        }
    })

    return (
        <main className="min-h-screen bg-background">
            <MapClient
                businesses={serializeDecimal(businesses) as any}
                user={serializeDecimal(user) as any}
            />
        </main>
    )
}
