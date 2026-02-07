
import { prisma } from '../src/lib/db';
import { generateSlug } from '../src/lib/slug';

async function generateMassiveSlugs() {
    console.log('🐌 Iniciando generación masiva de slugs para negocios...');

    const businesses = await prisma.business.findMany({
        where: {
            OR: [
                { slug: null },
                { slug: '' }
            ]
        },
        select: {
            id: true,
            name: true,
            city: true
        }
    });

    console.log(`🔍 Se encontraron ${businesses.length} negocios sin slug.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const b of businesses) {
        try {
            // Creamos un slug base: nombre + ciudad + 4 chars del ID para unicidad
            const baseSlug = generateSlug(`${b.name} ${b.city}`);
            const shortId = b.id.substring(b.id.length - 4);
            const finalSlug = `${baseSlug}-${shortId}`;

            await prisma.business.update({
                where: { id: b.id },
                data: { slug: finalSlug }
            });

            updatedCount++;
            if (updatedCount % 100 === 0) {
                console.log(`🔄 Progreso: ${updatedCount}/${businesses.length} actualizados...`);
            }
        } catch (error) {
            console.error(`❌ Error actualizando negocio ${b.id}:`, error);
            errorCount++;
        }
    }

    console.log('🏁 PROCESO COMPLETADO');
    console.log(`✅ Slugs actualizados: ${updatedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
}

generateMassiveSlugs()
    .catch(err => {
        console.error('💥 Error crítico:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
