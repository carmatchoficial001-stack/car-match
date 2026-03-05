import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkStudioLogs() {
    console.log("Fetching recent Studio logs...");
    const logs = await prisma.systemLog.findMany({
        where: {
            OR: [
                { source: 'Cloudinary' },
                { message: { contains: 'Worker', mode: 'insensitive' } },
                { message: { contains: 'Generando', mode: 'insensitive' } },
                { message: { contains: 'Pollinations', mode: 'insensitive' } },
                { message: { contains: 'Studio', mode: 'insensitive' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 30
    })

    console.log('--- STUDIO & CLOUDINARY LOGS ---')
    logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.level} [${log.source}]: ${log.message}`)
        if (log.metadata) {
            console.log(`  Meta: ${JSON.stringify(log.metadata).substring(0, 200)}`)
        }
    })

    console.log("\nChecking last 3 StudioMessages...");
    const studioMsgs = await prisma.studioMessage.findMany({
        where: { role: 'assistant' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, content: true, images: true, imagePrompt: true, createdAt: true }
    });

    studioMsgs.forEach(msg => {
        console.log(`\nMsg ID: ${msg.id} | Prompt: ${msg.imagePrompt?.substring(0, 50)}...`);
        console.log(`Images State:`, msg.images);
    });
}

checkStudioLogs()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
