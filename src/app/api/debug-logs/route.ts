import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
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

        const studioMsgs = await prisma.studioMessage.findMany({
            where: { imagePrompt: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, content: true, images: true, imagePrompt: true, createdAt: true }
        });

        return NextResponse.json({ logs, studioMsgs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
