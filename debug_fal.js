const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking last 5 StudioMessages and their status...");
        const lastMessages = await prisma.studioMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        
        if (lastMessages.length === 0) {
            console.log("No messages found.");
        }

        lastMessages.forEach(msg => {
            console.log(`\nID: ${msg.id}`);
            console.log(`Role: ${msg.role}`);
            console.log(`Type: ${msg.type}`);
            console.log(`Content prefix: ${msg.content?.substring(0, 50)}...`);
            console.log(`Status: ${msg.images?._status || 'COMPLETED or NULL'}`);
            console.log(`ImagePrompt: ${msg.imagePrompt ? 'YES' : 'NO'}`);
            console.log(`Images keys: ${Object.keys(msg.images || {}).filter(k => !k.startsWith('_')).join(', ')}`);
        });

        console.log("\nChecking SystemLogs for 'Fal.ai' or 'ERROR'...");
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    { message: { contains: 'Fal.ai' } },
                    { level: 'ERROR' }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        logs.forEach(l => {
            console.log(`[${l.level}] ${l.createdAt.toISOString()}: ${l.message}`);
        });

    } catch (e) {
        console.error("Debug script failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
