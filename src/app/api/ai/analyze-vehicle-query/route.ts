import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import { VEHICLE_CATEGORIES, BRANDS, COLORS, TRANSMISSIONS, FUELS } from '@/lib/vehicleTaxonomy'
import { DIAGNOSTICS_DB } from '@/lib/ai/diagnosticsDB'

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        console.log('🔍 [AI Search] Query recibido:', query)


        const prompt = `Actúa como un COMITÉ DE EXPERTOS EN AUTOMOCIÓN ("The CarMatch Brain Trust").
Tu objetivo es traducir el lenguaje natural del usuario a filtros técnicos PRECISOS, usando un proceso de pensamiento de 3 pasos (Cadena de Pensamiento).

**TU EQUIPO INTERNO:**
1.  🕵️ **EL ANALISTA (Agente 1):** Extrae datos crudos ("Troca", "Barata").
2.  ⚖️ **EL SUPERVISOR (Agente 2):** Critica y corrige según reglas de negocio (ej. "Troca" = Pickup, "Barata" < $250k).
3.  ✅ **EL ESTRATEGA (Agente 3):** Genera el JSON final validado.

**CONTEXTO TÉCNICO:**
- Categorías: ${Object.keys(VEHICLE_CATEGORIES).join(', ')}
- Tipos: ${Array.from(new Set(Object.values(VEHICLE_CATEGORIES).flat())).join(', ')}
- Marcas: ${Array.from(new Set(Object.values(BRANDS).flat())).slice(0, 50).join(', ')}...
- Transmisiones: ${TRANSMISSIONS.join(', ')}
- Combustibles: ${FUELS.join(', ')}
- Colors: ${COLORS.join(', ')}

**REGLAS DE NEGOCIO (EL LIBRO DE LA VERDAD):**
1.  **Semántica Regional (Lexicón):**
    Usa este diccionario para traducir términos antes de filtrar:
    ${JSON.stringify(DIAGNOSTICS_DB.SLANG_MAPPING, null, 2)}
    *Si el término no está aquí, usa tu mejor juicio inferido.*
    
    Tambien considera las **FALLAS COMUNES** para entender el contexto (ej. si buscan "sin fallas", evita estos):
    ${JSON.stringify(DIAGNOSTICS_DB.COMMON_FAILURES.slice(0, 20), null, 2)} // Muestra parcial para contexto

2.  **Precios Inteligentes:**
    - "Barato/Económico": $0 - $200,000.
    - "Lujo/Caro": $800,000+.
    - "300 mil" = 300000.
3.  **Antigüedad:** "Nuevo" >= ${new Date().getFullYear()}. "Viejo" <= 2010.
4.  **Atributos Técnicos:**
    - Si detectas "4x4", "todo terreno" -> traction: "4x4 (4WD)" o "Integral (AWD)".
    - Si detectas "V8", "8 cilindros" -> cylinders: 8.
    - Si detectas "piel", "quemacocos", "gps" -> features: ["Asientos de piel", "Quemacocos", "GPS"].

**FORMATO DE RESPUESTA (JSON PURO):**
{
    "category": "Automóvil | Motocicleta | Camión | Maquinaria | Especial",
    "vehicleType": "Sedán | SUV | Pickup | Coupe | Hatchback | ...",
    "brand": "Toyota | Ford | ...",
    "model": "Camry | Lobo | ...",
    "minPrice": number, "maxPrice": number,
    "minYear": number, "maxYear": number,
    "transmission": "Automática | Manual",
    "fuel": "Gasolina | Diesel | Híbrido | Eléctrico",
    "traction": "Delantera (FWD) | Trasera (RWD) | 4x4 (4WD) | Integral (AWD)",
    "color": "Blanco | Negro | Rojo | ...",
    "cylinders": number,
    "passengers": number,
    "doors": number,
    "features": ["string", "string"],
    "explanation": "Frase de confirmación del Estratega (ej. 'Buscando Pickups 4x4 Diesel con Piel...')."
}

**QUERY DEL USUARIO:**
"${query}"

**PROCESO DE PENSAMIENTO (Invisible):**
1. Analista: Detecta...
2. Supervisor: Corrige...
3. Estratega: JSON Final...

Responde SOLO con el JSON del Estratega.`

        // ✅ Flash para búsquedas (rápido y eficiente)
        // Usamos importación dinámica compatible o fallback a estática si es necesario
        // Pero para asegurar que no sea undefined, mejor importamos arriba o usamos el default de safeGenerateContent

        console.log('🤖 [AI Search] Preparando llamada a Gemini...')

        // safeGenerateContent usa geminiFlash por defecto si no se pasa modelo
        // Así que podemos simplificar y evitar problemas de importación
        const response = await safeGenerateContent(prompt, 5);
        // const { geminiFlash } = await import('@/lib/ai/geminiClient'); // Eliminado por riesgo de undefined

        const responseText = response.text()
        console.log('✅ [AI Search] Respuesta Raw:', responseText.substring(0, 500))

        const aiResponse = safeExtractJSON<any>(responseText)
        console.log('📊 [AI Search] Parsed Filters:', JSON.stringify(aiResponse, null, 2))


        if (!aiResponse) {
            return NextResponse.json({ error: 'AI Error: Invalid filters' }, { status: 500 })
        }

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('❌ [AI Search Crash]:', error)
        // 🚨 DEBUG: Exposing error details to client to diagnose production issue
        return NextResponse.json({
            error: 'AI Search Failed',
            details: error.message || String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
