import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function deepCheck() {
    console.log('--- ENVIRONMENT CHECK ---');
    console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'EXISTS' : 'MISSING');
    console.log('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'EXISTS' : 'MISSING');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');

    console.log('\n--- RECENT SYSTEM LOGS (LAST 20) ---');
    const logs = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    logs.reverse().forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] [${l.source || 'SYS'}] [${l.level}]: ${l.message}`);
        if (l.metadata) console.log('Metadata:', JSON.stringify(l.metadata));
    });

    console.log('\n--- RECENT STUDIO MESSAGES (LAST 5) ---');
    const messages = await prisma.studioMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    messages.forEach(m => {
        console.log(`Msg ID: ${m.id} | Type: ${m.type} | Role: ${m.role}`);
        console.log('Images JSON:', JSON.stringify(m.images));
        console.log('---');
    });
}

deepCheck()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
