// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * Helper para convertir URLs de imágenes (Cloudinary) a Base64
 */
export async function fetchImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Falló descarga: ${response.statusText}`)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return buffer.toString('base64')
    } catch (error) {
        console.error(`❌ Error convirtiendo imagen a base64 (${url}):`, error)
        return null
    }
}
