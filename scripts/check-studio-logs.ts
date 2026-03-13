import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudioLogs() {
  const logs = await prisma.systemLog.findMany({
    where: {
      source: { in: ['STUDIO-WEBHOOK', 'STUDIO-TRIGGER'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log(`Found ${logs.length} logs:`);
  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] [${log.level}] ${log.source} - ${log.message}`);
  });

  await prisma.$disconnect();
}

checkStudioLogs().catch(e => {
  console.error(e);
  process.exit(1);
});
