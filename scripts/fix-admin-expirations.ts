import { prisma } from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config();

async function fixAdminExpirations() {
    console.log('🚀 Iniciando corrección de vigencia para administradores (10 años)...');

    // 1. Encontrar todos los usuarios administradores
    const adminUsers = await prisma.user.findMany({
        where: {
            OR: [
                { isAdmin: true },
                { email: process.env.ADMIN_EMAIL }
            ]
        },
        select: { id: true, email: true, name: true }
    });

    if (adminUsers.length === 0) {
        console.error('❌ No se encontraron usuarios administradores.');
        return;
    }

    const adminIds = adminUsers.map(u => u.id);
    console.log(`👥 Se encontraron ${adminUsers.length} administradores: ${adminUsers.map(u => u.email).join(', ')}`);

    // 2. Actualizar Vehículos
    console.log('\n🚗 Actualizando Vehículos de administradores...');
    const vehicles = await prisma.vehicle.findMany({
        where: { userId: { in: adminIds } }
    });

    let vehicleUpdates = 0;
    for (const v of vehicles) {
        const creationDate = new Date(v.createdAt);
        const tenYearsLater = new Date(creationDate);
        tenYearsLater.setFullYear(creationDate.getFullYear() + 10);

        await prisma.vehicle.update({
            where: { id: v.id },
            data: {
                expiresAt: tenYearsLater,
                status: 'ACTIVE' // Asegurar que estén activos
            }
        });
        vehicleUpdates++;
    }
    console.log(`✅ ${vehicleUpdates} vehículos actualizados.`);

    // 3. Actualizar Negocios
    console.log('\n🏬 Actualizando Negocios de administradores...');
    const businesses = await prisma.business.findMany({
        where: { userId: { in: adminIds } }
    });

    let businessUpdates = 0;
    for (const b of businesses) {
        const creationDate = new Date(b.createdAt);
        const tenYearsLater = new Date(creationDate);
        tenYearsLater.setFullYear(creationDate.getFullYear() + 10);

        await prisma.business.update({
            where: { id: b.id },
            data: {
                expiresAt: tenYearsLater,
                isActive: true // Asegurar que estén activos
            }
        });
        businessUpdates++;
    }
    console.log(`✅ ${businessUpdates} negocios actualizados.`);

    console.log('\n🏁 PROCESO FINALIZADO');
}

fixAdminExpirations()
    .catch(err => console.error('💥 Error en el script:', err))
    .finally(() => prisma.$disconnect());
