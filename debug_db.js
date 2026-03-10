const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    console.log("Listing last 10 StudioMessages...");
    const msgs = await prisma.studioMessage.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    
    if (msgs.length === 0) {
        console.log("No StudioMessages found in the database.");
    } else {
        msgs.forEach(m => {
            console.log(`ID: ${m.id} | Status: ${m.images?._status} | Prompt: ${m.images?._imagePrompt?.substring(0, 30)}...`);
        });
    }
    await prisma.$disconnect();
}

debug();
