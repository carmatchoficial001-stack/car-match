import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function findMessageOwner() {
    const msgId = 'cmmjapc300001dj9sydnvsjx2';
    const msg = await prisma.studioMessage.findUnique({
        where: { id: msgId },
        include: { user: true }
    });
    
    if (msg) {
        console.log(`Message ${msgId} found!`);
        console.log(`User: ${msg.user.email} (ID: ${msg.user.id})`);
        console.log(`Content: ${msg.content.substring(0, 50)}...`);
    } else {
        console.log(`Message ${msgId} not found in DB.`);
    }
    process.exit(0);
}

findMessageOwner().catch(console.error);
