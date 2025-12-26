const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllUsers() {
    try {
        console.log('🗑️  Iniciando proceso de eliminación de usuarios...');

        // Contar usuarios antes de borrar
        const userCount = await prisma.user.count();
        console.log(`📊 Total de usuarios en la base de datos: ${userCount}`);

        if (userCount === 0) {
            console.log('✅ No hay usuarios para eliminar.');
            return;
        }

        // Confirmar antes de borrar
        console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará TODOS los usuarios y sus datos relacionados.');
        console.log('⏳ Esperando 3 segundos antes de proceder...\n');

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Borrar todas las relaciones primero (para evitar errores de clave foránea)
        console.log('🔄 Eliminando datos relacionados...');

        // Eliminar favoritos de vehículos
        const deletedFavorites = await prisma.favorite.deleteMany({});
        console.log(`   ✓ Favoritos eliminados: ${deletedFavorites.count}`);

        // Eliminar vehículos
        const deletedVehicles = await prisma.vehicle.deleteMany({});
        console.log(`   ✓ Vehículos eliminados: ${deletedVehicles.count}`);

        // Eliminar negocios
        const deletedBusinesses = await prisma.business.deleteMany({});
        console.log(`   ✓ Negocios eliminados: ${deletedBusinesses.count}`);

        // Eliminar cuentas (accounts de NextAuth)
        const deletedAccounts = await prisma.account.deleteMany({});
        console.log(`   ✓ Cuentas OAuth eliminadas: ${deletedAccounts.count}`);

        // Eliminar sesiones
        const deletedSessions = await prisma.session.deleteMany({});
        console.log(`   ✓ Sesiones eliminadas: ${deletedSessions.count}`);

        // Finalmente, eliminar usuarios
        console.log('\n🗑️  Eliminando usuarios...');
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`   ✓ Usuarios eliminados: ${deletedUsers.count}`);

        console.log('\n✅ ¡Proceso completado exitosamente!');
        console.log('📊 Base de datos limpia y lista para empezar de cero.\n');

    } catch (error) {
        console.error('❌ Error al eliminar usuarios:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la función
deleteAllUsers();
