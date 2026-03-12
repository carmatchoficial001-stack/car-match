
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- AUDITORÍA DE FALLOS (POSTS SIN IMAGEN) ---');
    const problemPosts = await prisma.socialPost.findMany({
        where: { imageUrl: null },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    
    console.log(`Encontrados ${problemPosts.length} posts sin imagen.`);
    
    for (const post of problemPosts) {
        console.log(`Post: ${post.id} | Status: ${post.status} | Creado: ${post.createdAt.toISOString()}`);
        // Ver si hay logs de error para este post
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    { message: { contains: post.id } },
                    { metadata: { path: ['postId'], equals: post.id } }
                ]
            }
        });
        console.log(`  - Logs encontrados: ${logs.length}`);
        logs.forEach(l => console.log(`    [${l.level}] ${l.source}: ${l.message}`));
    }

    console.log('\n--- AUDITORÍA DE CHATS (POSIBLE ERROR DE RUTA) ---');
    const ghostMessages = await prisma.studioMessage.findMany({
        where: {
            images: { path: ['_status'], contains: 'generating' }
        },
        take: 5
    });
    console.log(`Mensajes de chat "fantasma" (campañas guardadas aquí por error): ${ghostMessages.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
