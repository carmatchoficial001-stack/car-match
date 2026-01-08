import 'dotenv/config';
import { updateTaxonomyDatabase } from '../src/lib/ai/taxonomyUpdater';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('🚀 Iniciando escaneo de mercado con Inteligencia Artificial...');
    try {
        const result = await updateTaxonomyDatabase();
        console.log('✨ Resultado del escaneo:', result);
    } catch (error) {
        console.error('❌ Error durante la actualización:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
