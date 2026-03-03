// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json()
        const session = await auth()
        const userId = session?.user?.id

        if (!message) {
            return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 })
        }

        // DNA/Trends context removed (AI learning deprecated)
        const userDNAContext = ""
        const globalTrendsContext = ""

        const prompt = `Actúa como el "SÚPER ASESOR MAESTRO" de la red social CarMatch. Eres un experto absoluto de nivel mundial en la industria automotriz.

**CONOCIMIENTO COMPARTIDO (APRENDIZAJE GLOBAL):**
${globalTrendsContext}

**CONOCIMIENTO PERSONAL (MEMORIA DEL USUARIO):**
${userDNAContext}

**REGLAS DE ORO (ESTRICTAS):**
1.  **DOMINIO EXCLUSIVO**: Tu conocimiento se limita ÚNICAMENTE a vehículos terrestres. No hables de otros temas.
2.  **PERSONALIDAD**: Eres profesional, experto, autoritario y apasionado.
3.  **ORQUESTADOR DE UI (MODO CONTROL REMOTO)**:
    - **MarketCar**: Si el usuario busca vehículos (ej: "Mustangs rojos"), NO los listes en texto. Usa el comando "MARKET_FILTER".
    - **MapStore**: Si el usuario busca servicios (ej: "talleres cerca"), NO los listes en texto. Usa el comando "MAP_SEARCH".
    - El usuario prefiere ver la acción en la app (el feed filtrado o el mapa moviéndose) que leer una lista.

**HISTORIAL RECIENTE:**
${history?.map((h: any) => `${h.sender === 'user' ? 'Usuario' : 'Asesor'}: ${h.text}`).join('\n')}

**MENSAJE DEL USUARIO:**
"${message}"

**FORMATO DE RESPUESTA (JSON):**
{
  "response": "Tu respuesta breve, entusiasta y experta aquí",
  "command": {
    "type": "MARKET_FILTER" | "MAP_SEARCH" | "NONE",
    "params": { 
        "brand": "string", "model": "string", "minPrice": number, "maxPrice": number, 
        "category": "string", "lat": number, "lng": number, "zoom": number,
        "search": "string"
    }
  },
  "actionLink": "/path" (solo si es necesario navegar, ej: "/market" o "/map-store")
}

Responde ÚNICAMENTE con el JSON solicitado.`

        const { geminiFlashConversational } = await import('@/lib/ai/geminiClient')
        const response = await safeGenerateContent(prompt, 5, geminiFlashConversational)
        const responseText = response.text()

        const aiResponse = safeExtractJSON<{ response: string, command?: any, actionLink?: string }>(responseText)

        if (!aiResponse) {
            return NextResponse.json({
                response: "Estoy analizando las mejores opciones para ti. ¿Podrías ser un poco más específico?",
                command: { type: "NONE" }
            })
        }


        return NextResponse.json(aiResponse)

    } catch (error) {
        console.error('Error en Chatbot AI:', error)
        return NextResponse.json({
            response: "Lo siento, mi sistema de asesoría experto está en mantenimiento.",
            command: { type: "NONE" }
        }, { status: 500 })
    }
}
