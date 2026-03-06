
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRawUnsafe('SELECT * FROM "StudioMessage" WHERE id = \'cmme8qanx0004jo0ang9mxukr\'');
        console.log('Raw result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('SQL Error:', e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
