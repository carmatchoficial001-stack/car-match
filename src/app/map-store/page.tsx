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

    const user = session?.user?.email
        ? await prisma.user.findUnique({ where: { email: session.user.email } })
        : null

    // Fetch active businesses OR businesses owned by the current user (if logged in)
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

    // 🤖 FAQ SCHEMA for MapStore Authority
    const mapStoreFaqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "¿Cómo me ayuda el buscador inteligente de MapStore?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "El buscador de MapStore está diseñado para detectar problemas mecánicos basados en tus síntomas y recomendarte los negocios expertos (talleres, desponchadoras, refaccionarias) más cercanos a tu ubicación en tiempo real."
                }
            },
            {
                "@type": "Question",
                "name": "¿Hay servicios 24 horas en el MapStore?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí, el MapStore de CarMatch filtra automáticamente negocios con servicio de emergencia 24/7, incluyendo auxilio vial, grúas y mecánicos a domicilio."
                }
            }
        ]
    }

    return (
        <div className="h-full w-full bg-background">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(mapStoreFaqLd) }} />
            <MapClient
                businesses={serializeDecimal(businesses) as any}
                user={serializeDecimal(user) as any}
            />
        </div>
    )
}
