import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkRecentMsgs() {
    console.log('--- RECENT USER MESSAGES IN STUDIO ---');
    const msgs = await prisma.studioMessage.findMany({
        where: { role: 'user' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    for (const m of msgs) {
        console.log(`[${m.createdAt.toISOString()}] Conv: ${m.conversationId} | Content: ${m.content.substring(0, 50)}`);
        // Check for corresponding assistant messages in the same conv
        const assistantMsg = await prisma.studioMessage.findFirst({
            where: {
                conversationId: m.conversationId,
                role: 'assistant',
                createdAt: { gte: m.createdAt }
            }
        });
        console.log(`  Assistant Resp: ${assistantMsg ? 'FOUND' : 'MISSING'}`);
    }
}

checkRecentMsgs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
