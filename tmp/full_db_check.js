const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE CHECK ---');
    try {
        const count = await prisma.studioMessage.count();
        console.log(`Total StudioMessages: ${count}`);

        const messages = await prisma.studioMessage.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Retrieved: ${messages.length} messages`);

        messages.forEach((m, i) => {
            console.log(`\n[${i}] ID: ${m.id}`);
            console.log(`Role: ${m.role}`);
            console.log(`Status: ${m.images?._status}`);
            console.log(`CreatedAt: ${m.createdAt}`);
            console.log(`Images keys: ${Object.keys(m.images || {}).join(', ')}`);
        });

        const logsCount = await prisma.systemLog.count();
        console.log(`\nTotal SystemLogs: ${logsCount}`);
        const lastLogs = await prisma.systemLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        lastLogs.forEach(l => console.log(`${l.createdAt.toISOString()} | ${l.level} | ${l.message}`));

    } catch (e) {
        console.error('DATABASE ERROR:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
