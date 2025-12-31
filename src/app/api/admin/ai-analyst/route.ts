import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 🛡️ Admin Check Master (ENV or DB)
        const isAdminMaster = session.user.email === process.env.ADMIN_EMAIL

        if (!isAdminMaster) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { isAdmin: true }
            })

            if (!user?.isAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        if (!genAI) {
            return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
        }

        // Obtener datos agregados por ciudad para detectar oportunidades físicas reales
        const [vehicleStats, businessStats] = await Promise.all([
            prisma.vehicle.groupBy({
                by: ['city', 'vehicleType'],
                _count: { _all: true },
                where: { status: 'ACTIVE' }
            }),
            prisma.business.groupBy({
                by: ['city', 'category'],
                _count: { _all: true }
            })
        ])

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const prompt = `Actúa como un CONSULTOR ESTRATÉGICO DE NEGOCIOS AUTOMOTRICES DE ÉLITE. Tu misión es analizar los datos de CarMatch para crear NEGOCIOS FÍSICOS altamente rentables.

**OBJETIVO:** Identificar oportunidades de inversión con una efectividad del 90%+ basada en la demanda real de los usuarios en cada ciudad.

**DATOS ACTUALES (Agrupados por Ciudad y Categoría):**
- Oferta de Vehículos: ${JSON.stringify(vehicleStats)}
- Competencia (Negocios Existentes): ${JSON.stringify(businessStats)}

**TUS MISIONES ESTRATÉGICAS:**
1.  **Detección de "Océanos Azules"**: Encuentra ciudades específicas donde el volumen de vehículos supera por mucho a los servicios disponibles.
2.  **Plan de Inversión Física**: Recomienda qué negocio físico abrir (Taller especializado, Refaccionaria, Autolavado Premium, etc.) para capturar el mercado local.
3.  **Restricción de Rubro**: Solo negocios relacionados con el mundo automotriz terrestre.
4.  **Tono**: Ejecutivo, enfocado en ROI y éxito garantizado.

**FORMATO DE RESPUESTA (ESTRICTO JSON):**
{
    "summary": "Resumen ejecutivo de la situación actual y potencial por ciudad.",
    "insights": [
        {
            "priority": "HIGH/MEDIUM/LOW",
            "observation": "Descripción del hallazgo (ej. En CDMX hay exceso de SUVs pero pocos centros de detallado).",
            "recommendation": "Acción específica de inversión física."
        }
    ],
    "businessOppotunities": [
        "Negocio Físico Sugerido 1",
        "Negocio Físico Sugerido 2"
    ],
    "effectivenessScore": 95
}

Responde SOLO con el JSON válido.`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const aiResponse = JSON.parse(cleanedResponse)

        return NextResponse.json(aiResponse)

    } catch (error) {
        console.error('❌ Error in Admin AI Analyst:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
