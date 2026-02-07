
import { prisma } from '../src/lib/db';

async function main() {
    console.log('🗑️ Eliminando Centrales de Autobús (por lotes)...');

    let totalDeleted = 0;
    while (true) {
        const batch = await prisma.business.findMany({
            where: { category: 'central_autobus' },
            select: { id: true },
            take: 1000
        });

        if (batch.length === 0) break;

        const ids = batch.map(b => b.id);
        const result = await prisma.business.deleteMany({
            where: { id: { in: ids } }
        });

        totalDeleted += result.count;
        console.log(`   🗑️ Borrados ${result.count} buses... (Total: ${totalDeleted})`);

        // Small pause
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`✅ Eliminación COMPLETADA. Total: ${totalDeleted}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
