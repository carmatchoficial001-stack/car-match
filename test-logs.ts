import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLogs() {
    const logs = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })
    console.log(JSON.stringify(logs, null, 2))
}

checkLogs()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
