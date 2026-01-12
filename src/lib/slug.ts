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
