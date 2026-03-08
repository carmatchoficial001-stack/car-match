require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- LATEST LOGS ---");
    try {
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] [${log.level}] ${log.message}`);
            if (log.metadata) console.log("Metadata:", JSON.stringify(log.metadata));
        });

        if (logs.length === 0) console.log("No logs found.");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
