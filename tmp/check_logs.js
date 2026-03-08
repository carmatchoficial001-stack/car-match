require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- REAL-TIME LOG CHECK ---");
    try {
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] [${log.level}] ${log.message}`);
        });

        if (logs.length === 0) console.log("No logs found.");
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
