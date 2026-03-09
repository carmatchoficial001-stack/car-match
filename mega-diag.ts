import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function megaDiagnose() {
    console.log('--- CONVERSATIONS CHECK ---');
    const convs = await prisma.studioConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5
    });
    console.log(`Found ${convs.length} recent conversations.`);
    for (const c of convs) {
        console.log(`- Conv: ${c.title} (${c.id}) | Updated: ${c.updatedAt}`);
        const msgCount = await prisma.studioMessage.count({ where: { conversationId: c.id } });
        console.log(`  Messages: ${msgCount}`);

        if (msgCount > 0) {
            const lastMsg = await prisma.studioMessage.findFirst({
                where: { conversationId: c.id },
                orderBy: { createdAt: 'desc' }
            });
            console.log(`  Last Msg Status: ${JSON.stringify((lastMsg?.images as any)?._status || 'none')}`);
        }
    }

    console.log('\n--- ERROR LOGS TODAY ---');
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const errors = await prisma.systemLog.findMany({
        where: {
            level: 'ERROR',
            createdAt: { gte: startOfToday }
        },
        orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${errors.length} errors today.`);
    errors.forEach(e => {
        console.log(`[${e.createdAt.toISOString()}] ${e.message}`);
        if (e.metadata) console.log('Metadata:', JSON.stringify(e.metadata));
    });
}

megaDiagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
