import { prisma } from '../src/lib/db';

async function main() {
    console.log('🔍 Verificando servicios públicos importados...\n');

    const categories = ['hospital', 'policia', 'aeropuerto'];

    for (const category of categories) {
        const count = await prisma.business.count({
            where: { category }
        });
        console.log(`${category.toUpperCase()}: ${count} registros`);
    }

    console.log('\n📊 Total por estado (Hospitales):');
    const hospitalsByState = await prisma.business.groupBy({
        by: ['state'],
        where: { category: 'hospital' },
        _count: true,
        orderBy: { state: 'asc' }
    });

    for (const item of hospitalsByState) {
        console.log(`  ${item.state}: ${item._count} hospitales`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
