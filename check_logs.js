const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Fetching last 20 SystemLogs...");
    const logs = await prisma.systemLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    });
    
    logs.forEach(l => {
        console.log(`[${l.level}] ${l.createdAt.toISOString()}: ${l.message}`);
    });
    
    await prisma.$disconnect();
}

check();
