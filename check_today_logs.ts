import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkAnyLogs() {
    console.log("=== REVISANDO LOGS GLOBALES DE HOY ===")
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await prisma.systemLog.findMany({
        where: {
            createdAt: {
                gte: today
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    if (logs.length === 0) {
        console.log("❌ No hay NINGÚN log registrado hoy en la tabla SystemLog.");

        // Check latest 5 logs ever to see what was the last activity
        const latestEver = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log("\nÚltimos 5 logs históricos:");
        latestEver.forEach(l => console.log(`[${l.createdAt.toISOString()}] [${l.level}] ${l.source}: ${l.message}`));
    } else {
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] [${l.level}] ${l.source}: ${l.message}`);
        });
    }
    process.exit(0);
}

checkAnyLogs().catch(console.error)
