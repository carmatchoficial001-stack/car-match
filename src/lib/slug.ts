/**
 * Convierte un nombre en un slug amigable para URL
 * Ej: "Taller de Rubén & Co!" -> "taller-de-ruben-co"
 */
export function generateSlug(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Elimina acentos
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-') // Espacios por guiones
        .replace(/[^\w-]+/g, '') // Elimina caracteres especiales
        .replace(/--+/g, '-') // Elimina guiones dobles
        .replace(/^-+/, '') // Elimina guiones al inicio
        .replace(/-+$/, '') // Elimina guiones al final
}

/**
 * Genera un link semántico para vehículos (Wikipedia Style)
 * Ej: "Toyota", "Tacoma", 2022, "Juárez" -> "toyota-tacoma-2022-juarez"
 */
export function generateVehicleSlug(brand: string, model: string, year: number, city: string | null): string {
    const parts = [brand, model, year.toString(), city].filter(Boolean) as string[]
    return generateSlug(parts.join(' '))
}

/**
 * Genera un link semántico para negocios
 * Ej: "Taller El Rayo", "Juárez" -> "taller-el-rayo-juarez"
 */
export function generateBusinessSlug(name: string, city: string): string {
    return generateSlug(`${name} ${city}`)
}
