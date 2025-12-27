import { prisma } from '@/lib/db'
import { model } from '@/lib/ai-client'

/**
 * Asistente IA para el Chat de CarMatch (Powered by Gemini)
 */

export async function processChatMessage(chatId: string, messageContent: string, senderId: string) {
    // 1. Obtener contexto reciente del chat
    const recentMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        take: 6, // Últimos 6 mensajes para contexto
        include: { sender: { select: { name: true } } }
    })

    // Ordenar cronológicamente para la IA
    const history = recentMessages.reverse().map(m => `${m.sender.name}: ${m.content}`).join('\n')

    // 2. Verificar si ya se envió una alerta recientemente (anti-spam)
    const recentAlert = await prisma.message.findFirst({
        where: {
            chatId,
            senderId: 'SYSTEM_AI', // ID virtual, se maneja abajo
            createdAt: {
                gt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 horas
            }
        }
    })

    if (recentAlert) return

    // 3. Consultar a Gemini
    if (!process.env.GOOGLE_API_KEY) return

    const prompt = `
        Actúa como el "SUPER ANALISTA DE DATOS" de CarMatch. Tu misión es ser un asistente de seguridad y logística para compradores y vendedores de VEHÍCULOS MOTORIZADOS TERRESTRES.

        CONTEXTO DEL CHAT:
        ${history}
        
        INSTRUCCIONES DE PROCESAMIENTO:
        1. **Detección de Intención**: Identifica si los usuarios quieren verse, probar el vehículo o negociar un punto de encuentro.
        2. **Consejo del Analista**: Si hay intención, genera una respuesta profesional y autoritaria.
           - Menciona que CarMatch NO se involucra en las negociaciones.
           - Sugiere temas técnicos a revisar (ej. "Revisa el humo en frío", "Verifica el número de serie en el chasis", "Prueba la compresión").
           - Insiste en el uso de Puntos Medios Seguros.
        3. **Restricción de Tema**: Si hablan de cosas no relacionadas con vehículos (ej. comida, mascotas), ignóralos.

        FORMATO DE RESPUESTA (JSON PURO):
        { 
          "detectado": true/false, 
          "sugerencia": "Tu consejo experto nivel master. Sé breve pero impactante. Ejemplo: '🚨 ANALISTA: He detectado intención de cita. Recuerda que no intervenimos en tratos, pero te sugiero revisar el estado de las llantas y el historial de servicios. Por seguridad, usa el botón de abajo para ver puntos medios monitoreados.'" 
        }
    `

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Limpieza básica de JSON (por si la IA añade markdown)
        const jsonStr = responseText.replace(/```json|```/g, '').trim()
        const aiResponse = JSON.parse(jsonStr)

        if (aiResponse.detectado) {
            // 4. Inyectar mensaje del sistema
            let systemUser = await prisma.user.findFirst({ where: { email: 'ai-bot@carmatch.App' } })

            if (!systemUser) {
                systemUser = await prisma.user.create({
                    data: {
                        name: 'Asistente CarMatch 🤖',
                        email: 'ai-bot@carmatch.App',
                        image: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
                        password: 'bot-secure-password-hash',
                        isAdmin: true
                    }
                })
            }

            // Añadimos un token especial que el frontend reconocerá para mostrar el botón
            const contentWithAction = `${aiResponse.sugerencia}\n\n[ACTION:SCHEDULE]`

            await prisma.message.create({
                data: {
                    chatId,
                    senderId: systemUser.id,
                    content: contentWithAction,
                    isRead: false
                }
            })

            console.log(`🤖 Chat AI: Sugerencia enviada al chat ${chatId}`)
        }

    } catch (error) {
        console.error('Error procesando Chat AI:', error)
    }
}

