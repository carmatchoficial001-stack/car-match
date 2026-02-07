
import { prisma } from '../src/lib/db';

async function main() {
    const electrolineras = await prisma.business.count({ where: { category: 'electrolinera' } });
    const casetas = await prisma.business.count({ where: { category: 'caseta' } });
    const hospitales = await prisma.business.count({ where: { category: 'hospital' } });

    console.log(`STATS_CHECK: Electrolineras=${electrolineras}, Casetas=${casetas}, Hospitales=${hospitales}`);
}

main();
