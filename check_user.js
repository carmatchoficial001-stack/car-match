const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userId = 'cmkooyxr30000js0auooig5e4';
        console.log(`Checking messages for user ${userId}...`);
        
        const messages = await prisma.studioMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        if (messages.length === 0) {
            console.log("No messages found for this user.");
        } else {
            messages.forEach(m => {
                console.log(`- [${m.createdAt.toISOString()}] ${m.role} (${m.type}): ${m.content?.substring(0, 30)}...`);
                if (m.role === 'assistant') {
                    console.log(`  Images Status: ${m.images?._status || 'N/A'}`);
                }
            });
        }
        
        console.log("\nChecking last 5 StudioConversations for this user...");
        const convs = await prisma.studioConversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });
        convs.forEach(c => console.log(`- ${c.id}: ${c.title} (Updated: ${c.updatedAt.toISOString()})`));

    } catch (e) {
        console.error("Debug script failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
