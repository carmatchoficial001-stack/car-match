import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import aiCache from '@/lib/ai/aiCache' // 💰 Sistema de caché para reducir costos

export async function POST(req: NextRequest) {
    try {
        const { query, categories } = await req.json()

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
        // Prompt mejorado para diagnóstico experto (Persona: Veterano de 100 años)
        const prompt = `Actúa como un COMITÉ DE EXPERTOS EN DIAGNÓSTICO AUTOMOTRIZ ("The CarMatch Service Board").

**TU EQUIPO INTERNO:**
1.  🩺 **EL DIAGNOSTA (Agente 1):** Identifica síntomas y posibles causas basándose en física y mecánica.
2.  🔎 **EL INVESTIGADOR (Agente 2):** Busca términos desconocidos en la base de datos interna (slang, fallas comunes por modelo).
3.  ✅ **EL JEFE DE TALLER (Agente 3):** Decide la categoría final y emite la recomendación.

**TU DOMINIO:** Vehículos terrestres motorizados.

**REGLAS DE DERIVACIÓN (Protocolo del Jefe de Taller):**
- ⚙️ **Mecánica General:** Si es motor, humo, calentamiento, afinación, fugas de aceite o "algo suena mal" internamente -> [mecanico].
- ⚡ **Eléctrico:** Batería, luces, alternador, marcha, "no prende y hace clic" -> [electrico].
- ⛽ **Combustible:** "Gas", "Gasolina", "Diesel", "Echar", "Cargar", "Bomba" -> [gasolinera] (PRIORIDAD MÁXIMA).
- 🔊 **Ruidos/Suspensión:** "Golpeteo en baches", "Rechinido", "Jala a un lado", "Truena al dar vuelta" -> [suspension] o [mecanico].
- 🆘 **Urgencias:** "Llanta baja", "Ponchado", "Grúa" -> [llantera], [gruas].

**CASO: INVESTIGACIÓN DE TÉRMINOS DESCONOCIDOS:**
Si el usuario usa una palabra rara (ej. "Chirrimbolo", "Claxon que tose"), el Agente 2 DEBE inferir el contexto.
- "Suena como matraca" -> Ruido metálico rítmico -> [mecanico].
- "Huele a maple" -> Anticongelante quemado -> [radiadores] o [mecanico].

**DATOS TÉCNICOS DISPONIBLES:**
${categories.map((cat: any) => `- [${cat.id}] "${cat.label}": ${cat.keywords.slice(0, 5).join(', ')}...`).join('\n')}

**FORMATO DE RESPUESTA (JSON PURO):**
{
    "categories": ["ID_PRIORITARIO", "ID_SECUNDARIO"],
    "explanation": "Breve nota técnica del Jefe de Taller (ej. 'El humo azul indica quema de aceite, requiere mecánico general')."
}

**QUERY DEL USUARIO:**
"${query}"

**PROCESO DE PENSAMIENTO (Invisible):**
1. Diagnosta: Veo síntomas de X...
2. Investigador: El término Y significa Z...
3. Jefe: Derivando a [cat1, cat2]...

Responde SOLO con el JSON final.`

        console.log('🤖 Analizando query:', query)
        // 🚀 UPGRADE: Usamos Gemini PRO para máxima comprensión del "Concepto Mundial"
        // Aunque sea unos milisegundos más lento, la "Perfección" requiere el modelo más capaz.
        const { geminiPro } = await import('@/lib/ai/geminiModels');

        // Usamos geminiPro en lugar de flash para el análisis
        const response = await safeGenerateContent(prompt, 3, geminiPro);
        const responseText = response.text()
        console.log('✅ [AI Expert] Respuesta:', responseText)

        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            throw new Error('Invalid AI response format')
        }

        // 💾 PASO FINAL: Guardar en caché para futuras consultas idénticas
        aiCache.set(query, aiResponse, 'MAP_PROBLEM');
        console.log(`💰 [CACHE SAVE] Próximo diagnóstico idéntico será gratis.`);

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('❌ Error en análisis IA:', error.message || error)
        return NextResponse.json(
            { error: 'Error al analizar problema', categories: [], explanation: '' },
            { status: 500 }
        )
    }
}
