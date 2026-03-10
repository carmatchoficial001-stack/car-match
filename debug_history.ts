import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debugHistory() {
    console.log("=== DEBUGGING STUDIO HISTORY ===");
    
    const users = await prisma.user.findMany({
        where: { isAdmin: true },
        take: 5
    });
    
    for (const user of users) {
        const convCount = await prisma.studioConversation.count({ where: { userId: user.id } });
        const msgCount = await prisma.studioMessage.count({ where: { userId: user.id } });
        
        console.log(`User: ${user.email} (ID: ${user.id})`);
        console.log(`  Conversations: ${convCount}`);
        console.log(`  Messages: ${msgCount}`);
        
        if (convCount > 0) {
            const latestConv = await prisma.studioConversation.findFirst({
                where: { userId: user.id },
                orderBy: { updatedAt: 'desc' },
                include: { _count: { select: { messages: true } } }
            });
            console.log(`  Latest Conv: "${latestConv?.title}" with ${latestConv?._count.messages} messages`);
        }
    }
    process.exit(0);
}

debugHistory().catch(console.error);
