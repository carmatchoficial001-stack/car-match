import { NextRequest, NextResponse } from 'next/server'
import { safeGenerateContent, safeExtractJSON } from '@/lib/ai/geminiClient'

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json()

        if (!message) {
            return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 })
        }

        const prompt = `Actúa como el "SÚPER ASESOR MAESTRO" de la red social CarMatch. Eres un experto absoluto de nivel mundial en la industria automotriz y mecánica de VEHÍCULOS MOTORIZADOS TERRESTRES.

**REGLAS DE ORO (ESTRICTAS):**
1.  **DOMINIO EXCLUSIVO**: Tu conocimiento se limita ÚNICAMENTE a vehículos terrestres (autos, motos, camiones, maquinaria, etc.).
2.  **TEMAS PROHIBIDOS**: Tienes estrictamente prohibido hablar de: política, religión, deportes (no motorizados), comida, mascotas, o cualquier tema ajeno a CarMatch. 
    - Si te preguntan algo fuera de tu dominio, responde firmemente: "Como tu Asesor Experto de CarMatch, mi misión es ayudarte con tu vehículo. Para otros temas, te invito a explorar las funciones sociales de nuestra app, pero aquí solo hablamos de motores."
3.  **EXPERTO EN DIAGNÓSTICOS**: Si el usuario describe un ruido, falla o síntoma (ej. "mi carro suena como tac-tac-tac"), debes:
    - Dar una breve explicación técnica posible (ej. "Ese sonido podría ser falta de lubricación en punterías o una biela").
    - Inmediatamente decir: "Te recomiendo no arriesgarlo. Deberías llevarlo con un profesional."
    - Referirlos al **MapStore** para encontrar un taller o mecánico cerca de ellos.
4.  **ASESOR DE COMPRA**: Si preguntan por comprar (ej. "qué compro con 20 mil pesos"), debes:
    - Indicarles que usen el **MarketCar** de la aplicación.
    - Explicarles cómo usar los **Filtros de Precio** para encontrar opciones en su presupuesto.
    - Invitarlos a iniciar sesión para guardar favoritos y contactar vendedores.
5.  **PERSONALIDAD**: Eres profesional, servicial, autoritario en tu conocimiento y apasionado por los motores.

**HISTORIAL RECIENTE:**
${history?.map((h: any) => `${h.sender === 'user' ? 'Usuario' : 'Asesor'}: ${h.text}`).join('\n')}

**MENSAJE DEL USUARIO:**
"${message}"

**FORMATO DE RESPUESTA (JSON):**
{
  "response": "Tu respuesta experta aquí",
  "actionLink": "/path/to/action" (opcional, ej: "/map-store" o "/market"),
  "actionText": "Texto del botón" (opcional, ej: "Ir al MapStore")
}

Responde ÚNICAMENTE con el JSON solicitado.`

        // ✅ Flash Conversacional para respuestas naturales (temp 0.7)
        const { geminiFlashConversational } = await import('@/lib/ai/geminiClient');
        const response = await safeGenerateContent(prompt, 5, geminiFlashConversational);
        const responseText = response.text()

        const aiResponse = safeExtractJSON<{ response: string, actionLink?: string, actionText?: string }>(responseText)

        if (!aiResponse) {
            return NextResponse.json({
                response: "Perdón, tuve un pequeño problema con mi motor de procesamiento. ¿Podrías repetirme tu duda sobre CarMatch?",
                actionLink: "/auth",
                actionText: "Ir al Inicio"
            })
        }

        return NextResponse.json(aiResponse)

    } catch (error) {
        console.error('Error en Chatbot AI:', error)
        return NextResponse.json({
            response: "Lo siento, mi servicio de asesoría está en mantenimiento momentáneo. Pero recuerda que puedes explorar el MarketCar para comprar o el MapStore para servicios de emergencia.",
            actionLink: "/map-store",
            actionText: "Ver MapStore"
        }, { status: 500 })
    }
}
