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
        const prompt = `Actúa como un ASESOR EXPERTO DE CARMATCH ("The Service Advisor").
Tu misión es ayudar al usuario a encontrar el negocio automotriz ideal basándote en su problema o necesidad.

**TU DOMINIO:** Vehículos terrestres motorizados (autos, motos, camiones, maquinaria).

**BASE DE DATOS DE CONOCIMIENTO TÉCNICO:**
${JSON.stringify(DIAGNOSTICS_DB.COMMON_FAILURES, null, 2)}

**TAXONOMÍA DE CATEGORÍAS REALES (Grounding):**
${categories.map((cat: any) => `- [${cat.id}] "${cat.label}": ${cat.keywords.join(', ')}`).join('\n')}

**REGLAS DE INTERACCIÓN (1-5 PREGUNTAS):**
1.  **EFICIENCIA MÁXIMA:** Si el usuario es explícito (ej: "busco desponchadora", "taller de transmisiones", "tengo una llanta ponchada"), devuelve isConversational: false y las categorías de inmediato.
2.  **DIAGNÓSTICO SI ES NECESARIO:** Si el problema es vago (ej: "mi carro no prende", "tira agua", "hace un ruido raro"), inicia una conversación corta (isConversational: true).
3.  **LÍMITE DE TURNOS:** Máximo 5 preguntas. Si después de 5 turnos no tienes certeza, da el mejor resultado posible basado en lo que sabes.
4.  **TONO:** Profesional pero cercano. Usa datos técnicos si ayuda al diagnóstico.

**HISTORIAL DE CHARLA:**
${JSON.stringify(history || [], null, 2)}

**FORMATO DE RESPUESTA (JSON PURO):**
{
    "isConversational": boolean,
    "nextQuestion": "Pregunta corta y específica para refinar la búsqueda",
    "categories": ["ID_DE_CATEGORIA_1", "ID_DE_CATEGORIA_2"],
    "explanation": "Breve explicación técnica de por qué recomiendas esto.",
    "isDeepSearch": boolean
}

**QUERY ACTUAL DEL USUARIO:**
"${query}"

Responde SOLO con el JSON final.`

        console.log('🤖 Consultando Asesor Experto para:', query)
        const { geminiPro } = await import('@/lib/ai/geminiModels');
        const response = await safeGenerateContent(prompt, 3, geminiPro);
        const responseText = response.text()
        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            throw new Error('Invalid AI response format')
        }

        // 🛡️ REFUERZO: Asegurar que las categorías devueltas existan en nuestra taxonomía
        const validIds = new Set(categories.map((c: any) => c.id));
        if (aiResponse.categories) {
            aiResponse.categories = aiResponse.categories.filter((id: string) => validIds.has(id));
        }

        // 💾 PASO FINAL: Guardar en caché
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
