const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Limpiando Base de Datos ---');
    try {
        const deleted = await prisma.publicityCampaign.deleteMany({});
        console.log(`Éxito: Se eliminaron ${deleted.count} campañas.`);
    } catch (e) {
        console.error('Error al limpiar:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
