import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTriggerLogs() {
  const logs = await prisma.systemLog.findMany({
    where: { source: 'STUDIO-TRIGGER' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  logs.forEach(log => {
    console.log(`[${log.createdAt.toISOString()}] ${log.message}`);
    console.log(JSON.stringify(log.metadata, null, 2));
  });

  await prisma.$disconnect();
}

checkTriggerLogs().catch(e => {
  console.error(e);
  process.exit(1);
});
