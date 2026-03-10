import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function createTestConv() {
    const email = 'carmatchoficial001@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("Admin not found.");
        process.exit(1);
    }

    const conv = await prisma.studioConversation.create({
        data: {
            userId: user.id,
            title: "TEST MANUAL 1"
        }
    });

    const msg = await prisma.studioMessage.create({
        data: {
            userId: user.id,
            conversationId: conv.id,
            role: 'user',
            content: "Hola, esto es una prueba manual."
        }
    });

    console.log(`Created manual conv: ${conv.id} and message: ${msg.id}`);
    process.exit(0);
}

createTestConv().catch(console.error);
