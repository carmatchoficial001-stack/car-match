// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { serializeDecimal } from '@/lib/serialize'
import { redirect } from 'next/navigation'
import MapClient from '../map/MapClient'

// 💰 OPTIMIZACIÓN: Dynamic import - Mapbox solo se carga cuando se necesita (-500KB JS initial)
export const dynamic = 'force-dynamic'

export const metadata = {
    title: "CarMatch",
    description: "Servicios automotrices 24/7 con servicio a domicilio. Localiza mecánicos, desponchadoras, refaccionarias con entrega y auxilio vial inmediato en Juárez y todo México. CarMatch te salva en el camino.",
    keywords: [
        "mapa de negocios", "mapa automotriz", "buscador de talleres", "directorio mecanico",
        "servicio a domicilio", "mecánico a domicilio Juárez", "refcciones a domicilio",
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

    // 💰 OPTIMIZACIÓN CRÍTICA: 
    // No descargamos NADA desde el servidor inicialmente. 
    // Esto evita mostrar negocios irrelevantes de otras partes del mundo.
    // El MapClient se encargará de pedir los negocios cercanos en cuanto detecte la ubicación del usuario.
    const businesses: any[] = []

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
