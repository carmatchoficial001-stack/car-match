import { prisma } from '../src/lib/db';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
    console.log('🔍 Iniciando Diagnóstico de Administración...');
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log('📧 Email configurado en .env:', adminEmail);

    try {
        const user = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!user) {
            console.log('❌ Error: El usuario con el email del .env no existe en la base de datos.');
            return;
        }

        console.log('✅ Usuario encontrado en DB:', user.email);
        console.log('🛡️ Estado isAdmin actual:', user.isAdmin);
        console.log('💰 Créditos actuales:', user.credits);

        if (!user.isAdmin) {
            console.log('⚙️ Forzando permiso isAdmin en DB...');
            await prisma.user.update({
                where: { email: adminEmail },
                data: { isAdmin: true }
            });
            console.log('🚀 PERMISO ADMIN FORZADO EXITOSAMENTE.');
        } else {
            console.log('✨ El usuario ya tiene permisos de administrador en DB.');
        }

        // Probar si existe la tabla de transacciones
        try {
            const txCount = await prisma.creditTransaction.count();
            console.log('📊 Tabla CreditTransaction encontrada. Conteo:', txCount);
        } catch (e) {
            console.log('🚨 ERROR: La tabla CreditTransaction NO existe en la base de datos física.');
            console.log('👉 Necesitas ejecutar: npx prisma db push');
        }

    } catch (error) {
        console.error('💥 Error catastrófico de conexión:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
