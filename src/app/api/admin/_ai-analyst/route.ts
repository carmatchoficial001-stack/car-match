import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'

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

        // Obtener datos agregados para detectar oportunidades reales
        const [vehicleStats, businessStats, searchStats] = await Promise.all([
            prisma.vehicle.groupBy({
                by: ['city', 'vehicleType'],
                _count: { _all: true },
                where: { status: 'ACTIVE' }
            }),
            prisma.business.groupBy({
                by: ['city', 'category'],
                _count: { _all: true }
            }),
            prisma.searchMetric.groupBy({
                by: ['category'],
                _count: { _all: true },
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                    }
                }
            })
        ])

        const prompt = `Actúa como un CONSULTOR ESTRATÉGICO DE NEGOCIOS AUTOMOTRICES DE ÉLITE y experto en GEOMARKETING. Tu misión es analizar los datos de CarMatch para detectar OPPORTUNIDADES DE ORO y OCÉANOS AZULES con un 90%+ de probabilidad de éxito.

**CONTEXTO:**
CarMatch es una red social automotriz que rastrea lo que los usuarios buscan (Demanda) y qué negocios existen (Competencia).

**DATOS DE INTELIGENCIA REAL (Últimos 30 días):**
- Oferta de Vehículos (Inventario Activo): ${JSON.stringify(vehicleStats)}
- Competencia (Negocios Físicos Registrados): ${JSON.stringify(businessStats)}
- Demanda Real (Métricas de Búsqueda de Usuarios): ${JSON.stringify(searchStats)}

**TUS MISIONES CRÍTICAS:**
1.  **Detección de Océanos Azules**: Identifica combinaciones de CIUDAD + CATEGORÍA que tengan un volumen de búsqueda ALTO pero 0 o muy pocos negocios registrados. (ROI Inmediato).
2.  **Análisis de ROI del 90%+**: Proporciona recomendaciones tácticas para abrir negocios físicos (ej. "Abre una Desponchadora 24/7 en [Ciudad] porque hay 500 búsquedas nocturnas y 0 servicios").
3.  **Gap Analysis Geográfico**: Explica dónde está el dinero que se está perdiendo por falta de servicios.
4.  **Priorización Agresiva**: Clasifica las oportunidades por efectividad real basada en el déficit de oferta.

**FORMATO DE RESPUESTA (ESTRICTO JSON):**
{
    "summary": "Análisis ejecutivo de alto nivel sobre los huecos de mercado detectados.",
    "insights": [
        {
            "priority": "CRITICAL/HIGH/MEDIUM",
            "observation": "Hueco detectado (ej. 300 personas buscaron transmisiones en Monterrey esta semana y no hay talleres especializados).",
            "recommendation": "Acción de inversión física específica."
        }
    ],
    "businessOppotunities": [
        {
            "title": "Nombre del Negocio Sugerido",
            "location": "Ciudad sugerida",
            "roiScore": 95,
            "reason": "Justificación basada en datos"
        }
    ],
    "effectivenessScore": 98
}

Responde SOLO con el JSON válido, sin explicaciones adicionales fuera del JSON.`

        // ✅ Flash para análisis de datos de negocio (rápido)
        const { geminiFlash } = await import('@/lib/ai/geminiClient');
        const response = await safeGenerateContent(prompt, 5, geminiFlash);
        const responseText = response.text()
        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            return NextResponse.json({ error: 'AI Error: Invalid JSON response' }, { status: 500 })
        }

        return NextResponse.json(aiResponse)

    } catch (error) {
        console.error('❌ Error in Admin AI Analyst:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
