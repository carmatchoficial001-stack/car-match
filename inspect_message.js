
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const msg = await prisma.studioMessage.findUnique({
        where: { id: 'cmme8qanx0004jo0ang9mxukr' }
    });
    console.log(JSON.stringify(msg, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
