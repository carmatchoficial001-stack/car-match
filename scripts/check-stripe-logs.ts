import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStripeLogs() {
  const logs = await prisma.systemLog.findMany({
    where: {
      OR: [
        { source: 'StripeWebhook' },
        { source: 'PaymentService' },
        { message: { contains: 'Stripe' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log(`Found ${logs.length} logs:`);
  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] [${log.level}] ${log.source} - ${log.message}`);
    if (log.metadata) {
      console.log(` -> Metadata: ${JSON.stringify(log.metadata)}`);
    }
  });

  await prisma.$disconnect();
}

checkStripeLogs().catch(e => {
  console.error(e);
  process.exit(1);
});
