// API route para obtener stats del Marketing Studio
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // Validar que el usuario está autenticado y es admin
    const session = await auth();

    if (!session?.user || !session.user.isAdmin) {
        return NextResponse.json(
            { error: 'No autorizado - Solo admin' },
            { status: 401 }
        );
    }

    try {
        // Llamar a Marketing Studio API
        const response = await fetch(
            `${process.env.MARKETING_STUDIO_URL}/api/admin/stats`,
            {
                headers: {
                    'x-carmatch-api-key': process.env.MARKETING_STUDIO_API_KEY || ''
                }
            }
        );

        if (!response.ok) {
            throw new Error('Error obteniendo stats del Marketing Studio');
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error conectando con Marketing Studio:', error);
        return NextResponse.json(
            { error: 'Error conectando con Marketing Studio' },
            { status: 500 }
        );
    }
}
