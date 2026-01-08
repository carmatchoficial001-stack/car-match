import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'

export async function POST(req: NextRequest) {
    try {
        const { query, categories } = await req.json()

        if (!query || !categories) {
            return NextResponse.json(
                { error: 'Query y categories son requeridos' },
                { status: 400 }
            )
        }

        // Prompt de análisis automático (backend - no visible para usuario)
        // Prompt mejorado para diagnóstico experto (Persona: Veterano de 100 años)
        const prompt = `Actúa como un MEGAPROCESADOR TÉCNICO VETERANO de CarMatch. Tu base de datos interna fusiona la sabiduría del mejor mecánico de la historia con el procesamiento de datos en tiempo real de vehículos motorizados terrestres.

**TU DOMINIO EXCLUSIVO:** Cualquier vehículo terrestre motorizado (Autos, Motos, Camiones, Maquinaria, Autobuses, Especiales). No tratas temas fuera de este nicho.

**TUS OBJETIVOS CRÍTICOS:**
1.  🔬 **Diagnóstico de Ultra-Precisión**: El usuario te dará un problema ("ruido", "olor", "jaloneo"). Debes deducir la causa raíz basándote en física automotriz y mecánica profunda.
2.  🎯 **Mapeo de Categorías**: Recomienda los especialistas de CarMatch que puedan SOLUCIONAR el problema.
3.  🛡️ **Protocolo de Seguridad**: Si detectas una falla que pone en riesgo la vida (frenos, fuego, dirección), inicia con "🚨 PROTOCOLO DE SEGURIDAD ACTIVADO:".

**DATOS TÉCNICOS DE APOYO (Categorías CarMatch):**
${categories.map((cat: any) => `- [${cat.id}] "${cat.label}": Enfocado a ${cat.keywords.join(', ')}`).join('\n')}

**LÓGICA DE PROCESAMIENTO SUPER-INTELIGENTE:**
- ⚙️ **Diferenciación Semántica**: 
    - "Motor" ≠ "Moto". Si el usuario busca "reparar motor", el especialista es [TALLER] o [REFACCIONES]. No sugieras [MOTOS] a menos que mencione explícitamente un vehículo de 2 o 3 ruedas.
    - "Cuerpo de aceleración" → [TALLER] (Mecánica) o [ELECTRICO].
    - "Marcha/Burro de arranque" → [ELECTRICO].
- 🚛 **Especialización Diesel**: Si detectas términos como "cabezal", "quinta rueda", "compresor de aire de frenado" o "suspensión de aire", PRIORIZA [DIESEL] y [ACCESORIOS_PESADOS].
- 🚜 **Maquinaria Pesada**: Si menciona "hidráulicos", "mando final" o "orugas", el especialista es [MAQUINARIA].
- 🌡️ **Termodinámica**: 
    - Humo azul = Aceite siendo quemado (Sellos de válvula o anillos). → [TALLER].
    - Humo negro = Exceso de combustible (Sensores o inyectores). → [TALLER].
    - Humo blanco (dulce) = Anticongelante (Junta de cabeza). → [RADIADORES] y [TALLER].

**FORMATO DE RESPUESTA (ESTRICTO JSON):**
{
    "categories": ["ID_MAS_RELEVANTE", "ID_SECUNDARIO"],
    "explanation": "Usa un tono de experto nivel Master. Explica el fenómeno mecánico (ej. 'La detonación prematura en el cilindro 3 está causando el cascabeleo...') y por qué el especialista seleccionado es el adecuado."
}

**QUERY DEL USUARIO A ANALIZAR:**
"${query}"

Responde UNICAMENTE con el JSON solicitado.`

        console.log('🤖 Analizando query:', query)
        const response = await safeGenerateContent(prompt)
        const responseText = response.text()
        console.log('✅ Respuesta de IA:', responseText)

        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            throw new Error('Invalid AI response format')
        }

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('❌ Error en análisis IA:', error.message || error)
        return NextResponse.json(
            { error: 'Error al analizar problema', categories: [], explanation: '' },
            { status: 500 }
        )
    }
}
