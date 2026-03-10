import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUserLogs() {
    const email = 'anaorzara@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found");
        process.exit(0);
    }
    
    const logs = await prisma.systemLog.findMany({
        where: { 
            OR: [
                { message: { contains: user.id } },
                { message: { contains: email } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    
    console.log(`Found ${logs.length} logs for ${email}`);
    logs.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] ${l.source} [${l.level}]: ${l.message}`);
    });
    process.exit(0);
}

checkUserLogs().catch(console.error);
