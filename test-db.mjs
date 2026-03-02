import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.publicityCampaign.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log(JSON.stringify(c.metadata, null, 2));
}
main().finally(() => prisma.$disconnect());
