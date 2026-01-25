import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import { VEHICLE_CATEGORIES, BRANDS, COLORS, TRANSMISSIONS, FUELS } from '@/lib/vehicleTaxonomy'

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        console.log('🔍 [AI Search] Query recibido:', query)


        const prompt = `Actúa como un ASISTENTE DE COMPRAS AUTOMOTRIZ SUPER-INTELIGENTE. Tu misión es traducir el lenguaje natural del usuario a filtros técnicos para una base de datos de vehículos TERRÉSTRES MOTORIZADOS.

**CONTEXTO TÉCNICO:**
- Categorías: ${Object.keys(VEHICLE_CATEGORIES).join(', ')}
- Marcas: ${Array.from(new Set(Object.values(BRANDS).flat())).slice(0, 100).join(', ')} (Y muchas más)
- Colores: ${COLORS.join(', ')}
- Transmisiones: ${TRANSMISSIONS.join(', ')}
- Combustibles: ${FUELS.join(', ')}

**INSTRUCCIONES:**
1.  **Interpretación de Precios**: 
    - Si dice "barato", asume un rango de $0 a $250,000 MXN.
    - Si dice "caro" o "lujo", asume minPrice $800,000+.
    - Si menciona una cifra como "300 mil" o "300k", interpreta como 300000.
2.  **Mapeo de Categorías**: 
    - "Troca" o "Camioneta de carga" -> Pickup.
    - "Camioneta familiar" -> SUV o Minivan.
    - "Moto" -> Motocicleta.
3.  **Antigüedad**:
    - "Nuevo" -> Año >= 2024.
    - "Viejo" o "Clásico" -> Año <= 2000.
    - "Reciente" -> Año >= 2020.

**FORMATO DE RESPUESTA (JSON PURO):**
{
    "category": "string (Exacto: 'Automóvil', 'Motocicleta', 'Camión', 'Maquinaria', 'Especial')",
    "vehicleType": "string (Estilo/Carrocería, ej. 'Sedán', 'SUV', 'Pickup', 'Coupe')",
    "brand": "string", "model": "string",
    "minPrice": number, "maxPrice": number, 
    "minYear": number, "maxYear": number,
    "color": "string (Capitalizado)", "transmission": "string", "fuel": "string",
    "passengers": number,
    "explanation": "Breve frase profesional sobre la búsqueda."
}

**CONOCIMIENTO UNIVERSAL CARMATCH:**
- Sabe todo sobre: Autos de lujo, deportivos, utilitarios.
- Motos: Deportivas, Scooters, ATVs, RZRs.
- Pesados: Tractocamiones, Torton, Autobuses.
- Maquinaria: Retroexcavadoras (Mano de chango), Tractores agrícolas, Montacargas.
- Slang: "Troca" es Pickup. "Barato" es <200k (autos) o <350k (pickups/maquinaria). "Nuevo" es >= 2024.

**QUERY DEL USUARIO:**
"${query}"

Responde SOLO con el JSON válido.`

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
        return NextResponse.json({ error: 'AI Error' }, { status: 500 })
    }
}
