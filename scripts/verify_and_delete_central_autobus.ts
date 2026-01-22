import { prisma } from '../src/lib/db';

async function main() {
    console.log('🔍 Verificando registros de central_autobus...\n');

    const count = await prisma.business.count({
        where: { category: 'central_autobus' }
    });

    console.log(`📊 Total de registros encontrados: ${count}\n`);

    if (count > 0) {
        console.log('🗑️ Eliminando registros...');

        const result = await prisma.business.deleteMany({
            where: { category: 'central_autobus' }
        });

        console.log(`✅ Eliminados: ${result.count} registros`);
    } else {
        console.log('✅ No hay registros de central_autobus en la base de datos');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
