const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mock() {
    try {
        const userId = 'cmkooyxr30000js0auooig5e4'; // The user from logs
        console.log(`Mocking a message for user ${userId}...`);
        
        // Find or create a conversation
        let conv = await prisma.studioConversation.findFirst({
            where: { userId }
        });
        
        if (!conv) {
            console.log("Creating mock conversation...");
            conv = await prisma.studioConversation.create({
                data: {
                    userId,
                    title: "Test de Conectividad Fal.ai"
                }
            });
        }
        
        console.log("Saving mock message...");
        const msg = await prisma.studioMessage.create({
            data: {
                userId,
                conversationId: conv.id,
                role: 'user',
                content: 'Test message from debug script',
                type: 'CHAT'
            }
        });
        
        console.log("Success! Message saved with ID: " + msg.id);

    } catch (e) {
        console.error("Mock failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

mock();
