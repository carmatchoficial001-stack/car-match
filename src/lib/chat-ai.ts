import { prisma } from '@/lib/db'
import { safeGenerateContent, safeExtractJSON } from './ai/geminiClient'

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
        Actúa como el "SÚPER ANALISTA DE DATOS" de CarMatch. Tu misión es ser el asistente de seguridad y logística definitivo. Eres frío, profesional y extremadamente conocedor de fierros.

        CONTEXTO DEL CHAT:
        ${history}
        
        INSTRUCCIONES DE PROCESAMIENTO:
        1. **Detección de Intención**: Identifica si quieren verse, negociar o tienen dudas técnicas.
        2. **Consejo del Analista (Checklist Pro)**:
           - Si hablan de **AUTOS**: "Revisa humo en frío, ruidos de metal en el motor y que el VIN coincida en tablero y puerta."
           - Si hablan de **DIESEL/CAMIONES**: "Verifica presión de aceite en caliente, estado del turbo y que no sople por la bayoneta."
           - Si hablan de **MAQUINARIA**: "Checa horas de uso reales, fugas en mandos hidráulicos y tensión de orugas/llantas."
        3. **Seguridad CarMatch**:
           - Recuérdales que CarMatch no interviene en tratos.
           - Insiste en PUNTOS MEDIOS SEGUROS y horario diurno.
        4. **Anti-Spam**: Sé directo y breve.

        FORMATO DE RESPUESTA (JSON PURO):
        { 
          "detectado": true, 
          "sugerencia": "🚨 ANALISTA: He detectado intención de cita. [Tu consejo técnico específico aquí]. Por seguridad, usen puntos medios públicos y de día. No intervenimos en tratos." 
        }
    `

    try {
        // ✅ Flash Preciso para detección de intención (temp 0.2)
        const { geminiFlashPrecise } = await import('./ai/geminiClient');
        const response = await safeGenerateContent(prompt, 5, geminiFlashPrecise);
        const responseText = response.text()

        const aiResponse = safeExtractJSON<{ detectado: boolean, sugerencia: string }>(responseText)

        if (aiResponse?.detectado) {
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

