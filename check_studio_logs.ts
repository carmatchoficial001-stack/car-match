import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkStudioLogs() {
    const logs = await prisma.systemLog.findMany({
        where: {
            OR: [
                { source: 'StudioWorker' },
                { message: { contains: 'HF' } },
                { message: { contains: 'Cloudinary' } },
                { source: { contains: 'API-ROUTE' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    console.log("=== ÚLTIMOS ERRORES DE STUDIO WORKER ===")
    if (logs.length === 0) console.log("No logs found.")

    logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] [${l.level}] ${l.message}`)
    })

    await prisma.$disconnect()
}

checkStudioLogs().catch(console.error)
