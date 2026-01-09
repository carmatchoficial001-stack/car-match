"use client"

import { useState, useRef } from 'react'
import { uploadMultipleToCloudinary } from '@/lib/cloudinary'

interface ImageUploadStepProps {
    images: string[]
    onImagesChange: (images: string[]) => void
    invalidImageUrls?: Set<string>
}

export default function ImageUploadStep({ images, onImagesChange, invalidImageUrls }: ImageUploadStepProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadingGallery, setUploadingGallery] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const coverCameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)
    const galleryCameraInputRef = useRef<HTMLInputElement>(null)

    // Foto de portada = images[0]
    // Galería = images[1...9]
    const coverImage = images[0]
    const galleryImages = images.slice(1)

    // Subir foto de portada (1 sola)
    const handleCoverUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setError(null)
        setUploading(true)

        try {
            const urls = await uploadMultipleToCloudinary(Array.from(files).slice(0, 1))

            // Si ya hay portada, reemplazarla
            if (coverImage) {
                onImagesChange([urls[0], ...galleryImages])
            } else {
                onImagesChange([urls[0], ...images])
            }
        } catch (err) {
            console.error('Error subiendo portada:', err)
            setError(err instanceof Error ? err.message : 'Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    // Subir fotos de galería (hasta 9)
    const handleGalleryUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setError(null)

        // Validar que no exceda 9 en galería
        const totalGallery = galleryImages.length + files.length
        if (totalGallery > 9) {
            setError(`Solo puedes tener máximo 9 fotos en la galería. Tienes ${galleryImages.length} y estás intentando agregar ${files.length}.`)
            return
        }

        setUploadingGallery(true)

        try {
            const urls = await uploadMultipleToCloudinary(Array.from(files))

            // Agregar a galería (después de la portada)
            if (coverImage) {
                onImagesChange([coverImage, ...galleryImages, ...urls])
            } else {
                onImagesChange([...images, ...urls])
            }
        } catch (err) {
            console.error('Error subiendo galería:', err)
            setError(err instanceof Error ? err.message : 'Error al subir imágenes')
        } finally {
            setUploadingGallery(false)
        }
    }

    const removeCover = () => {
        // Si hay galería, la primera foto de galería se vuelve portada
        if (galleryImages.length > 0) {
            onImagesChange(galleryImages)
        } else {
            onImagesChange([])
        }
    }

    const removeGalleryImage = (index: number) => {
        const newGallery = galleryImages.filter((_, i) => i !== index)
        onImagesChange(coverImage ? [coverImage, ...newGallery] : newGallery)
    }

    // ... (rest of logic unchanged) ...

    return (
        <div className="space-y-8">
            {/* Título */}
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Fotos de tu vehículo</h2>
                <p className="text-text-secondary">
                    Sube una foto de portada y opcionalmente hasta 9 fotos adicionales
                </p>
            </div>

            {/* SECCIÓN 1: Foto de Portada (OBLIGATORIA) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-700 text-text-primary rounded-full flex items-center justify-center font-bold">
                        1
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Foto de Portada</h3>
                        <p className="text-sm text-text-secondary">Esta será la imagen principal de tu vehículo (obligatoria)</p>
                    </div>
                </div>

                {/* Fix: Inputs moved outside conditional so they exist for "Change Photo" button */}
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e.target.files)}
                    className="hidden"
                />
                <input
                    ref={coverCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleCoverUpload(e.target.files)}
                    className="hidden"
                />

                {!coverImage ? (
                    // Drop zone para portada (UNCHANGED)
                    <div
                        className={`
                            border-2 border-dashed rounded-xl p-8 transition-all
                            ${uploading ? 'opacity-50 pointer-events-none border-surface-highlight' : 'border-primary-700'}
                        `}
                    >


                        <div className="flex flex-col items-center text-center">
                            {uploading ? (
                                <>
                                    <div className="w-12 h-12 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-text-primary font-medium">Subiendo portada...</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => coverInputRef.current?.click()}
                                            className="flex flex-col items-center gap-2 p-4 bg-surface-highlight hover:bg-surface rounded-xl border border-transparent hover:border-primary-700 transition group"
                                        >
                                            <svg className="w-8 h-8 text-primary-400 group-hover:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-bold text-text-primary uppercase">Galería</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => coverCameraInputRef.current?.click()}
                                            className="flex flex-col items-center gap-2 p-4 bg-primary-700/10 hover:bg-primary-700/20 rounded-xl border border-primary-700/30 hover:border-primary-700 transition group"
                                        >
                                            <svg className="w-8 h-8 text-primary-500 group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-xs font-bold text-primary-400 uppercase">Cámara</span>
                                        </button>
                                    </div>
                                    <p className="text-text-primary font-bold mb-1">
                                        Selecciona tu foto de portada
                                    </p>
                                    <p className="text-text-secondary text-sm">
                                        Sube una foto existente o toma una nueva
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    // Vista previa de portada
                    <div className={`
                        relative aspect-video max-w-md bg-surface border-4 rounded-xl overflow-hidden
                        ${invalidImageUrls?.has(coverImage) ? 'border-red-500 shadow-red-500/20 shadow-lg' : 'border-primary-700'}
                    `}>
                        <img
                            src={coverImage}
                            alt="Portada"
                            className="w-full h-full object-cover"
                        />

                        {/* 🚨 Warning Overlay para imagen inválida */}
                        {invalidImageUrls?.has(coverImage) && (
                            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-bold text-sm bg-red-600 px-2 py-1 rounded">IMAGEN INVÁLIDA</span>
                            </div>
                        )}

                        {/* Badge */}
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-primary-700 text-text-primary text-sm font-bold rounded-lg z-20">
                            ⭐ PORTADA
                        </div>

                        {/* Botón eliminar */}
                        <button
                            onClick={removeCover}
                            className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition z-20"
                            title="Eliminar portada"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Botón cambiar */}
                        <button
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute bottom-3 right-3 px-4 py-2 bg-white/90 hover:bg-white rounded-lg transition font-medium text-sm text-gray-900 z-20"
                        >
                            Cambiar foto
                        </button>
                    </div>
                )}

                {/* Validación portada */}
                {!coverImage && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>⚠️ La foto de portada es obligatoria</span>
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: Galería (OPCIONAL) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-surface-highlight text-text-primary rounded-full flex items-center justify-center font-bold">
                        2
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Galería Adicional</h3>
                        <p className="text-sm text-text-secondary">Sube hasta 9 fotos más para mostrar detalles (opcional)</p>
                    </div>
                </div>

                {/* Drop zone galería */}
                <div
                    className={`
                        border-2 border-dashed rounded-xl p-6 transition-all
                        ${uploadingGallery ? 'opacity-50 pointer-events-none' : 'border-surface-highlight hover:border-primary-700/50'}
                    `}
                >
                    <input
                        ref={galleryInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleGalleryUpload(e.target.files)}
                        className="hidden"
                    />
                    <input
                        ref={galleryCameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleGalleryUpload(e.target.files)}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center text-center">
                        {uploadingGallery ? (
                            <>
                                <div className="w-10 h-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-text-primary text-sm">Subiendo fotos...</p>
                            </>
                        ) : (
                            <>
                                <div className="flex gap-3 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-surface-highlight hover:bg-surface rounded-lg border border-transparent hover:border-primary-700 transition"
                                    >
                                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-xs font-bold text-text-primary">GALERÍA</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => galleryCameraInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-700/10 hover:bg-primary-700/20 rounded-lg border border-primary-700/30 hover:border-primary-700 transition"
                                    >
                                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-xs font-bold text-primary-400">CÁMARA</span>
                                    </button>
                                </div>
                                <p className="text-text-primary text-sm font-medium">
                                    Agregar fotos adicionales
                                </p>
                                <p className="text-text-secondary text-xs mt-1">
                                    {galleryImages.length}/9 fotos • Puedes agregar {9 - galleryImages.length} más
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Grid galería */}
                {galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {galleryImages.map((url, index) => {
                            const isInvalid = invalidImageUrls?.has(url)
                            return (
                                <div
                                    key={index}
                                    className={`
                                    relative group aspect-square bg-surface rounded-lg overflow-hidden
                                    ${isInvalid ? 'border-2 border-red-500 shadow-red-500/20 shadow-md' : 'border border-surface-highlight'}
                                `}
                                >
                                    <img
                                        src={url}
                                        alt={`Galería ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />

                                    {isInvalid && (
                                        <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center z-10 pointer-events-none">
                                            <svg className="w-6 h-6 text-red-500 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Botón eliminar */}
                                    <button
                                        onClick={() => removeGalleryImage(index)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                                        title="Eliminar"
                                    >
                                        <div className="p-2 bg-red-500 hover:bg-red-600 rounded-lg">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Error global */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
        </div>
    )
}
