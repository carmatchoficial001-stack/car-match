
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRaw`SELECT count(*) FROM "StudioMessage"`;
    console.log('Raw count result:', result[0].count.toString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
