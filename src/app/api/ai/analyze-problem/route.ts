// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import aiCache from '@/lib/ai/aiCache' // 💰 Sistema de caché para reducir costos
import { DIAGNOSTICS_DB } from '@/lib/ai/diagnosticsDB'

export async function POST(req: NextRequest) {
    try {
        const { query, categories, history } = await req.json()

        if (!query || !categories) {
            return NextResponse.json(
                { error: 'Query y categories son requeridos' },
                { status: 400 }
            )
        }

        // 🚀 PASO 1: Intentar obtener del caché
        const cachedResult = aiCache.get(query, 'MAP_PROBLEM');
        if (cachedResult) {
            console.log(`⚡ [CACHE HIT] Diagnóstico recuperado del caché. $0 gastados.`);
            return NextResponse.json(cachedResult);
        }

        // Prompt de análisis automático (backend - no visible para usuario)
        const prompt = `Actúa como un COMITÉ DE EXPERTOS EN DIAGNÓSTICO AUTOMOTRIZ ("The CarMatch Service Board").

**TU EQUIPO INTERNO:**
1.  🩺 **EL DIAGNOSTA (Agente 1):** Identifica síntomas y posibles causas basándose en física y mecánica.
2.  🔎 **EL INVESTIGADOR (Agente 2):** Consulta la "Base de Datos Experta" para ver si es una falla conocida de ese modelo o slang regional.
3.  ✅ **EL JEFE DE TALLER (Agente 3):** Decide la categoría final y emite la recomendación.

**TU DOMINIO:** Vehículos terrestres motorizados.

**BASE DE DATOS DE CONOCIMIENTO EXPERTO ("The Knowledge"):**
${JSON.stringify(DIAGNOSTICS_DB.COMMON_FAILURES, null, 2)}

**DICCIONARIO DE SLANG:**
${JSON.stringify(DIAGNOSTICS_DB.SLANG_MAPPING, null, 2)}

**REGLAS DE DERIVACIÓN:**
- ⚙️ **Mecánica General:** Si es motor, humo, afinación, fugas o "algo suena mal" internamente -> [mecanico].
- ⚡ **Eléctrico:** Batería, luces, alternador, marcha -> [electrico].
- ⛽ **Combustible:** "Gasolina", "Diesel", "Gasolinera" -> [gasolinera] (PRIORIDAD MÁXIMA).
- 🆘 **Urgencias:** "Llanta baja", "Ponchado", "Grúa" -> [llantera], [gruas].

**HISTORIAL DE CHARLA:**
${JSON.stringify(history || [], null, 2)}

**REGLA DE EFICIENCIA CRÍTICA:**
- Si el problema es claro (ej: "busco desponchadora", "taller de frenos", "ponchado"), pon "isConversational": false y devuelve las categorías de inmediato.
- NO hagas preguntas de relleno. Si ya sabes qué categoría recomendar, DALO.
- Máximo 5 interacciones. Si llegas al límite de 5 turnos, DEBES parar y dar tu mejor resultado.

**DATOS TÉCNICOS DISPONIBLES:**
${categories.map((cat: any) => `- [${cat.id}] "${cat.label}": ${cat.keywords.slice(0, 5).join(', ')}...`).join('\n')}

**FORMATO DE RESPUESTA (JSON PURO):**
{
    "isConversational": boolean,
    "nextQuestion": "Pregunta corta si isConversational es true",
    "categories": ["ID_PRIORITARIO", "ID_SECUNDARIO"],
    "explanation": "Breve nota técnica del Jefe de Taller.",
    "isDeepSearch": boolean
}

**QUERY ACTUAL DEL USUARIO:**
"${query}"

Responde SOLO con el JSON final.`

        console.log('🤖 Analizando query:', query)
        const { geminiPro } = await import('@/lib/ai/geminiModels');
        const response = await safeGenerateContent(prompt, 3, geminiPro);
        const responseText = response.text()
        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            throw new Error('Invalid AI response format')
        }

        // 💾 PASO FINAL: Guardar en caché para futuras consultas idénticas
        aiCache.set(query, aiResponse, 'MAP_PROBLEM');
        return NextResponse.json(aiResponse)

    } catch (error) {
        console.error('API Analyze Problem Error:', error)
        return NextResponse.json({
            categories: [],
            explanation: "No pude analizar tu problema. Intenta ser más específico.",
            isConversational: false
        }, { status: 500 })
    }
}
