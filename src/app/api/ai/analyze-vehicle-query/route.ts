import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import { VEHICLE_CATEGORIES, BRANDS, COLORS, TRANSMISSIONS, FUELS } from '@/lib/vehicleTaxonomy'

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

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
    "filters": {
        "category": "string (opcional)",
        "brand": "string (opcional)",
        "model": "string (opcional)",
        "minPrice": number (opcional),
        "maxPrice": number (opcional),
        "minYear": number (opcional),
        "maxYear": number (opcional),
        "color": "string (opcional)",
        "transmission": "string (opcional)",
        "fuel": "string (opcional)"
    },
    "explanation": "Breve frase motivadora o explicativa de qué estás buscando (ej. '¡Claro! Aquí tienes las mejores SUVs familiares en el rango de precio que buscas.')"
}

**QUERY DEL USUARIO:**
"${query}"

Responde SOLO con el JSON válido.`

        const response = await safeGenerateContent(prompt)
        const responseText = response.text()

        const aiResponse = safeExtractJSON<any>(responseText)

        if (!aiResponse) {
            return NextResponse.json({ error: 'AI Error: Invalid filters' }, { status: 500 })
        }

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('❌ Error en Marketplace AI:', error)
        return NextResponse.json({ error: 'AI Error' }, { status: 500 })
    }
}
