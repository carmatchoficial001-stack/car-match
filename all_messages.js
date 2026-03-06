
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const msgs = await prisma.studioMessage.findMany();
    console.log('All StudioMessages:', JSON.stringify(msgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
