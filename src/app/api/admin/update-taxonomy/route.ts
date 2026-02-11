// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextResponse } from 'next/server';
import { fetchTaxonomyUpdates } from '@/lib/ai/taxonomyUpdater';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 🛡️ Admin Check Master (ENV or DB)
        const isAdminMaster = session.user.email === process.env.ADMIN_EMAIL

        if (!isAdminMaster) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { isAdmin: true }
            })

            if (!user?.isAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }
        const updates = await fetchTaxonomyUpdates();

        if (!updates) {
            return NextResponse.json({ success: false, message: "Error consultando a Gemini." }, { status: 500 });
        }

        // En una implementación real de producción, aquí escribiríamos los cambios
        // en el archivo vehicleTaxonomy.ts usando 'fs' (si fuera Node puro local)
        // o actualizando una base de datos.
        // Como estamos en un entorno Serverless/Next.js, lo ideal es guardar esto en DB
        // o simplemente devolverlo para inspección.

        return NextResponse.json({
            success: true,
            message: "Análisis de Gemini completado.",
            updates: updates
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
    }
}
