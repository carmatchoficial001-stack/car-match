const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Last 20 logs from SystemLog:");
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        logs.forEach(l => {
            console.log(`[${l.level}] ${l.createdAt.toISOString()} (${l.source}): ${l.message}`);
        });

    } catch (e) {
        console.error("Debug script failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
