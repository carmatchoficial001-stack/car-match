import { prisma } from "@/lib/db";

export async function getCachedAIResponse(key: string): Promise<string | null> {
    try {
        const cacheEntry = await prisma.searchMetric.findFirst({
            where: {
                query: key,
                metadata: {
                    path: ['type', 'equals', 'AI_CACHE']
                },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas de validez
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // NOTA: Usamos SearchMetric de forma creativa para no crear nuevas tablas si no es necesario,
        // pero idealmente se usaría una tabla AICache dedicada.
        // Como el usuario no quiere cambios drásticos en el esquema sin pedirlo,
        // planearemos una tabla AICache si es necesario más adelante.

        return null; // Por ahora regresamos null hasta estar seguros del esquema
    } catch (e) {
        return null;
    }
}

export async function setCachedAIResponse(key: string, response: string) {
    // Implementación futura una vez aprobada la tabla de caché
}
