// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { createHash } from 'crypto';

/**
 * Genera un hash único para un vehículo basado en sus características clave
 * Este hash se usa para detectar republicaciones del mismo vehículo
 */
export function generateVehicleHash(data: {
    brand: string;
    model: string;
    year: number;
    priceRange: number;
    coverImageHash: string;
}): string {
    const combined = `${data.brand.toLowerCase()}|${data.model.toLowerCase()}|${data.year}|${data.priceRange}|${data.coverImageHash}`;
    return createHash('sha256').update(combined).digest('hex');
}

/**
 * Genera un hash perceptual simple de una imagen URL
 * Para comparación básica de imágenes
 */
export async function hashImageUrl(imageUrl: string): Promise<string> {
    try {
        // Por ahora, usamos un hash simple de la URL
        // En el futuro, podríamos implementar hash perceptual real
        const urlHash = createHash('md5').update(imageUrl).digest('hex');
        return urlHash.substring(0, 16); // Primeros 16 caracteres
    } catch (error) {
        console.error('Error hashing image URL:', error);
        return '0000000000000000';
    }
}

/**
 * Redondea el precio a rangos de 5000 para tolerar pequeñas variaciones
 * Ejemplo: 147,000 -> 145,000 | 152,000 -> 150,000
 */
export function normalizePriceRange(price: number): number {
    return Math.floor(price / 5000) * 5000;
}

/**
 * Genera un hash de ubicación GPS con tolerancia de ~1km
 * Redondea a 2 decimales (lat/lng) para permitir variaciones pequeñas
 */
export function hashGPSLocation(lat: number | null, lng: number | null): string | null {
    if (!lat || !lng) return null;

    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const combined = `${roundedLat},${roundedLng}`;

    return createHash('md5').update(combined).digest('hex').substring(0, 12);
}
