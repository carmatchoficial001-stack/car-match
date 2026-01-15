import { prisma } from '../src/lib/db'

async function main() {
    const chatId = process.argv[2]
    if (!chatId) {
        console.log('Por favor proporciona un chatId')
        return
    }

    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
            _count: {
                select: { messages: true, appointments: true }
            }
        }
    })

    if (!chat) {
        console.log(`Chat ${chatId} no encontrado.`)
        return
    }

    console.log(`Chat ID: ${chatId}`)
    console.log(`Mensajes: ${chat._count.messages}`)
    console.log(`Citas: ${chat._count.appointments}`)

    const lastMessages = await prisma.message.findMany({
        where: { chatId },
        take: 5,
        orderBy: { createdAt: 'desc' }
    })

    console.log('Últimos 5 mensajes:', JSON.stringify(lastMessages, null, 2))
}

main()
