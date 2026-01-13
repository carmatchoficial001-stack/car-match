"use client"

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

interface ImageUploadProps {
    images: string[]
    onImagesChange: (images: string[]) => Promise<void> | void
    maxImages?: number
    label?: string
    required?: boolean
    fallbackContent?: React.ReactNode  // Contenido a mostrar cuando no hay imágenes
    imageType?: 'vehicle' | 'profile' | 'business' // 🛡️ NEW: Tipo de imagen para moderación
}

export default function ImageUpload({ images, onImagesChange, maxImages = 5, label, required = true, fallbackContent, imageType = 'vehicle' }: ImageUploadProps) {
    const { t } = useLanguage()
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('imageType', imageType) // 🛡️ Enviar tipo para moderación

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json();
            // Si es error de moderación, lanzar el mensaje específico
            if (errorData.reason) {
                throw new Error(errorData.reason);
            }
            throw new Error(errorData.error || 'Error al subir imagen')
        }

        const data = await response.json()
        return data.secure_url
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        // Validar que no exceda el máximo (si NO es reemplazo único)
        if (maxImages > 1 && images.length + files.length > maxImages) {
            setUploadError(`Solo puedes subir máximo ${maxImages} imágenes`)
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const uploadPromises = files.map(file => uploadToCloudinary(file))
            const urls = await Promise.all(uploadPromises)

            // Si es max 1, REEMPLAZAR. Si no, AGREGAR.
            if (maxImages === 1) {
                await onImagesChange([urls[0]])
            } else {
                await onImagesChange([...images, ...urls])
            }
        } catch (error: any) {
            console.error('Error subiendo imágenes:', error)
            // Mostrar mensaje enviado desde el backend (moderación) o genérico
            setUploadError(error.message || 'Error al subir imágenes. Intenta de nuevo.')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        onImagesChange(newImages)
    }

    return (
        <div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                    {label || t('publish.vehicle_photos')} {required && <span className="text-red-500">*</span>}
                </label>
                <p className="text-xs text-text-secondary mb-3">
                    {maxImages === 1
                        ? 'Esta foto aparecerá en la tarjeta de tu negocio.'
                        : `Sube hasta ${maxImages} fotos. La primera será la foto principal.`
                    }
                </p>

                <div className="flex gap-3">
                    {/* Botón de Galería */}
                    <button
                        type="button"
                        disabled={uploading || (maxImages > 1 && images.length >= maxImages)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium disabled:opacity-50 ${uploading
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-surface-highlight text-text-primary hover:bg-surface border border-transparent hover:border-primary-700/50'
                            }`}
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                        <span>
                            {maxImages === 1 && images.length > 0
                                ? 'Cambiar (Galería)'
                                : 'Elegir Galería'}
                        </span>
                    </button>

                    {/* Botón de Cámara */}
                    <button
                        type="button"
                        disabled={uploading || (maxImages > 1 && images.length >= maxImages)}
                        onClick={() => cameraInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg transition font-medium disabled:opacity-50 ${uploading
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-primary-700/10 text-primary-400 hover:bg-primary-700/20 border border-primary-700/30 hover:border-primary-700'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Tomar Foto</span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple={maxImages > 1}
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {uploadError && (
                    <p className="text-sm text-red-400 mt-2">{uploadError}</p>
                )}
            </div>

            {/* Grid de imágenes */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className={`relative bg-surface-highlight rounded-lg overflow-hidden group ${maxImages === 1 ? 'w-full max-w-sm mx-auto flex justify-center bg-black/50' : 'aspect-video'}`}>
                            <img
                                src={url}
                                alt={`Foto ${index + 1}`}
                                className={maxImages === 1 ? "max-w-full h-auto max-h-96 object-contain" : "w-full h-full object-contain bg-black/50"}
                            />

                            {/* Badge de foto principal */}
                            {index === 0 && (
                                <div className="absolute top-2 left-2 px-2 py-1 bg-primary-700 text-white text-xs font-medium rounded shadow-sm">
                                    Principal
                                </div>
                            )}

                            {/* Botón de eliminar */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                fallbackContent ? (
                    fallbackContent
                ) : (
                    <div className="border-2 border-dashed border-surface-highlight rounded-lg p-8 text-center">
                        <svg className="w-12 h-12 text-text-secondary mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-text-secondary text-sm">
                            {t('publish.no_photos_yet')}
                        </p>
                    </div>
                )
            )}
        </div>
    )
}
