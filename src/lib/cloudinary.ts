// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * Utilidades para subir imágenes a Cloudinary
 * Configuración para CarMatch
 */
import imageCompression from 'browser-image-compression' // 💰 Compresión para ahorrar $$

export interface CloudinaryUploadResponse {
    secure_url: string
    public_id: string
    width: number
    height: number
    format: string
}

/**
 * Sube una imagen a Cloudinary
 * @param file Archivo de imagen a subir
 * @returns URL segura de la imagen subida
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary no está configurado. Verifica las variables de entorno.')
    }

    // Validar archivo
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validFormats.includes(file.type)) {
        throw new Error('Formato no válido. Usa JPG, PNG o WEBP.')
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
        throw new Error('La imagen es muy grande. Máximo 5MB.')
    }

    // 💰 COMPRIMIR IMAGEN ANTES DE SUBIR (Ahorro: 80% storage + 70% bandwidth)
    let processedFile = file
    try {
        const options = {
            // ⚠️ CRITICAL: DO NOT CHANGE COMPRESSION SETTINGS. COST SAVING MEASURE.
            maxSizeMB: 0.5,        // 💰 500KB máximo (antes: 3-5MB)
            maxWidthOrHeight: 1920, // 💰 Full HD suficiente para zoom
            useWebWorker: true,     // No bloquear UI
            fileType: 'image/webp'  // 💰 WebP 30% más ligero que JPEG
        }
        processedFile = await imageCompression(file, options)
        console.log(`💰 Imagen comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(processedFile.size / 1024).toFixed(0)}KB`)
    } catch (error) {
        console.warn('⚠️ Error comprimiendo imagen, usando original:', error)
        // Continuar con archivo original si falla compresión
    }

    // Crear FormData
    const formData = new FormData()
    formData.append('file', processedFile)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'carmatch/vehicles')

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error?.message || 'Error al subir imagen')
        }

        const data: CloudinaryUploadResponse = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Error en Cloudinary upload:', error)
        throw error
    }
}

/**
 * Sube múltiples imágenes a Cloudinary
 * @param files Array de archivos de imagen
 * @param onProgress Callback para reportar progreso (opcional)
 * @returns Array de URLs de las imágenes subidas
 */
export async function uploadMultipleToCloudinary(
    files: File[],
    onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
    let completedCount = 0
    const total = files.length

    const uploadPromises = files.map(async (file) => {
        const url = await uploadToCloudinary(file)
        completedCount++
        if (onProgress) {
            onProgress(completedCount, total)
        }
        return url
    })

    return Promise.all(uploadPromises)
}

/**
 * Elimina una imagen de Cloudinary por su public_id
 * @param publicId ID público de la imagen en Cloudinary
 * @returns Resultado de la eliminación
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
    // Nota: La eliminación desde el cliente requiere configuración especial de Cloudinary
    // Por seguridad, esto debería hacerse desde el servidor
    // Esta función es un placeholder para implementación futura
    console.warn('deleteFromCloudinary debe implementarse en el servidor')
    return false
}

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param url URL de la imagen en Cloudinary
 * @returns Public ID o null si no es válida
 */
export function extractPublicId(url: string): string | null {
    try {
        // URL típica: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const match = url.match(/\/v\d+\/(.+)\.\w+$/)
        return match ? match[1] : null
    } catch {
        return null
    }
}
