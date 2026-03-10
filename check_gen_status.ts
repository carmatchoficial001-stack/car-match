import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkRecentGenerationLogs() {
    console.log("=== CHECKING RECENT GENERATION ATTEMPTS ===");
    
    const logs = await prisma.systemLog.findMany({
        where: { 
            OR: [
                { source: 'StudioWorker' },
                { source: 'IMAGE-GEN' },
                { source: 'STUDIO-HISTORY' }
            ],
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
        },
        orderBy: { createdAt: 'desc' },
        take: 30
    });
    
    if (logs.length === 0) {
        console.log("No generation logs found in the last 2 hours.");
    } else {
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] ${l.source} [${l.level}]: ${l.message}`);
        });
    }

    // Check if there are any messages with status 'generating'
    const pendingMsgs = await prisma.studioMessage.findMany({
        where: {
            images: { path: ['_status'], string_contains: 'generating' }
        },
        select: { id: true, images: true, createdAt: true }
    });

    console.log(`\nPending Messages in 'generating' state: ${pendingMsgs.length}`);
    pendingMsgs.forEach(m => {
        console.log(`- ${m.id} (Created: ${m.createdAt.toISOString()}) Status: ${(m.images as any)?._status}`);
    });

    process.exit(0);
}

checkRecentGenerationLogs().catch(console.error);
