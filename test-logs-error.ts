import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkLogs() {
    const logs = await prisma.systemLog.findMany({
        where: { level: 'ERROR' },
        orderBy: { createdAt: 'desc' },
        take: 10
    })
    console.log(JSON.stringify(logs, null, 2))
}

checkLogs()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
