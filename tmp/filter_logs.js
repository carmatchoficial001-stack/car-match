const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- ERROR/WARN LOGS (LAST 100) ---');
    const logs = await prisma.systemLog.findMany({
        where: {
            OR: [
                { level: 'ERROR' },
                { level: 'WARN' }
            ]
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
    });

    logs.forEach(l => {
        console.log(`${l.createdAt.toISOString()} | ${l.level} | ${l.message}`);
        if (l.metadata) console.log(`   Metadata: ${JSON.stringify(l.metadata)}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
