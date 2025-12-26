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

        // Verificar admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true }
        })

        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (!genAI) {
            return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
        }

        // Obtener datos agregados para el análisis
        const [vehicleStats, businessStats] = await Promise.all([
            prisma.vehicle.groupBy({
                by: ['category'],
                _count: { _all: true },
                where: { status: 'ACTIVE' }
            }),
            prisma.business.groupBy({
                by: ['category'],
                _count: { _all: true }
            })
        ])

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        const prompt = `Actúa como un CONSULTOR ESTRATÉGICO DE NEGOCIOS AUTOMOTRICES DE ÉLITE. Tu objetivo es analizar la base de datos de CarMatch y detectar oportunidades de negocio con una efectividad del 90%+.

**DATOS ACTUALES DEL SISTEMA:**
- Vehículos Activos por Categoría: ${JSON.stringify(vehicleStats)}
- Negocios Registrados por Categoría: ${JSON.stringify(businessStats)}

**TUS MISIONES:**
1.  **Detectar el "Market GAP"**: Si hay muchos vehículos de una categoría (ej. Camiones) pero pocos negocios relacionados (ej. Talleres Diesel), identifica el problema.
2.  **Sugerencias de Negocio**: Recomienda qué tipo de negocios debería reclutar o promocionar el administrador para satisfacer la demanda de los usuarios.
3.  **Restricción de Rubro**: Solo sugiere negocios relacionados con VEHÍCULOS MOTORIZADOS TERRESTRES (Mecánica, Refacciones, Estética automotriz, Grúas, Yonkes, etc.).
4.  **Tono de Reporte**: Profesional, analítico y directo.

**FORMATO DE RESPUESTA (ESTRICTO JSON):**
{
    "summary": "Resumen ejecutivo de la situación actual del mercado en la plataforma.",
    "insights": [
        {
            "priority": "HIGH/MEDIUM/LOW",
            "observation": "Descripción del hallazgo (ej. Hay 500 motocicletas pero solo 1 taller de motos).",
            "recommendation": "Acción específica para el administrador."
        }
    ],
    "businessOppotunities": [
        "Negocio Tipo A",
        "Negocio Tipo B"
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
