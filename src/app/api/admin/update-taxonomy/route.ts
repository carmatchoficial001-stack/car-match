
import { NextResponse } from 'next/server';
import { fetchTaxonomyUpdates } from '@/lib/ai/taxonomyUpdater';

export async function POST() {
    try {
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
