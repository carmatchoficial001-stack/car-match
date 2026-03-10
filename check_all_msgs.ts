import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkOrphanMessages() {
    console.log("=== CHECKING ALL STUDIO MESSAGES ===");
    
    const messages = await prisma.studioMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    
    if (messages.length === 0) {
        console.log("No studio messages found at all.");
    } else {
        for (const m of messages) {
            const user = await prisma.user.findUnique({ where: { id: m.userId }, select: { email: true } });
            console.log(`[${m.createdAt.toISOString()}] User: ${user?.email || m.userId}, Conv: ${m.conversationId}, Role: ${m.role}, Content: ${m.content.substring(0, 30)}`);
        }
    }

    process.exit(0);
}

checkOrphanMessages().catch(console.error);
