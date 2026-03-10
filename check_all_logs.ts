import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAllRecentLogs() {
    console.log("=== CHECKING ALL RECENT LOGS (Last 1 hour) ===");
    
    const logs = await prisma.systemLog.findMany({
        where: { 
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    
    if (logs.length === 0) {
        console.log("No logs found in the last hour.");
    } else {
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] ${l.source} [${l.level}]: ${l.message}`);
        });
    }

    process.exit(0);
}

checkAllRecentLogs().catch(console.error);
