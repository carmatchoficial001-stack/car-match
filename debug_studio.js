const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking Environment...");
    console.log("FAL_KEY present:", !!process.env.FAL_KEY);
    console.log("HUGGINGFACE_API_KEY present:", !!process.env.HUGGINGFACE_API_KEY);
    
    try {
        const lastMessages = await prisma.studioMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        
        console.log("\nLast 3 StudioMessages:");
        lastMessages.forEach(msg => {
            console.log(`- ID: ${msg.id}, Status: ${msg.images?._status || 'null'}, Created: ${msg.createdAt}`);
            if (msg.images?._status?.includes('error')) {
                console.log(`  ERROR DETECTED: ${msg.images._status}`);
            }
        });
    } catch (e) {
        console.error("Prisma check failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
