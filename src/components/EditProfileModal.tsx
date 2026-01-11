"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: {
        name: string | null
        image: string | null
        email?: string | null
    }
    userVehicles: any[] // Lista de vehículos del usuario para usar como foto
}



export default function EditProfileModal({ isOpen, onClose, currentUser, userVehicles }: EditProfileModalProps) {
    const router = useRouter()
    const [name, setName] = useState(currentUser.name || '')
    const [selectedImage, setSelectedImage] = useState(currentUser.image || '')
    const [loading, setLoading] = useState(false)

    const [imageError, setImageError] = useState(false)
    const initial = (currentUser.name?.[0] || currentUser.email?.[0] || '?').toUpperCase()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, image: selectedImage })
            })

            if (res.ok) {
                router.refresh()
                onClose()
            }
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const hasValidImage = selectedImage && (selectedImage.startsWith('http') || selectedImage.startsWith('/')) && !imageError

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-surface border border-surface-highlight rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-text-primary mb-6">Editar Perfil</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sección Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Nombre del Perfil
                        </label>

                        {/* Tip movido arriba por solicitud del usuario */}
                        <div className="mb-3 p-3 bg-primary-900/20 border border-primary-900/30 rounded-lg">
                            <p className="text-xs text-primary-300">
                                💡 <strong>Idea Creativa:</strong> ¿Por qué no usar un nombre divertido? <br />
                                Ejemplos: <em>"El Garaje de {currentUser.name?.split(' ')[0] || 'Ana'}", "Autos del Norte", "La Colección de {currentUser.name?.split(' ')[0] || 'Mike'}"</em>
                            </p>
                        </div>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="off"
                            data-lpignore="true"
                            className="w-full bg-background border border-surface-highlight rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition"
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    {/* Sección Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">
                            Foto de Perfil
                        </label>

                        {/* Subir Foto Personalizada */}
                        <div className="mb-6">
                            {/* Preview del avatar actual */}
                            <div className="mb-4">
                                {hasValidImage ? (
                                    <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface mx-auto">
                                        <img
                                            src={selectedImage}
                                            alt="Foto de perfil"
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                            onLoad={() => setImageError(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface relative mx-auto">
                                        <img
                                            src={`/defaults/avatars/car_${((currentUser.name?.charCodeAt(0) || 0) % 6) + 1}.png`}
                                            alt="Portada por defecto"
                                            className="w-full h-full object-cover opacity-90"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                            <span className="mt-8 text-6xl font-bold text-white drop-shadow-lg tracking-wider">
                                                {initial}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-text-secondary text-center mt-3">
                                    {hasValidImage ? 'Tu foto de perfil actual' : 'Así se ve tu perfil actualmente (sin foto personalizada)'}
                                </p>
                            </div>

                            <ImageUpload
                                label={(!selectedImage || (!selectedImage.startsWith('http') && !selectedImage.startsWith('/'))) ? "¡Sube tu primera foto!" : "Cambiar Foto"}
                                images={(selectedImage && (selectedImage.startsWith('http') || selectedImage.startsWith('/'))) ? [selectedImage] : []}
                                onImagesChange={(imgs) => setSelectedImage(imgs[0] || '')}
                                maxImages={1}
                                required={false}
                            />
                            <div className="mt-2 text-xs text-blue-300 bg-blue-900/20 border border-blue-900/30 p-2 rounded-lg flex items-start gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    <strong>Recomendación:</strong> CarMatch es una comunidad automotriz. ¡Sube una foto de tu nave, auto favorito, o el vehículo que vendes para destacar!
                                </span>
                            </div>
                        </div>



                        {/* Vehículos del Usuario (si tiene) */}
                        {userVehicles.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-bold">Tus Vehículos</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {userVehicles.map((vehicle) => (
                                        vehicle.images?.[0] && (
                                            <button
                                                key={vehicle.id}
                                                type="button"
                                                onClick={() => setSelectedImage(vehicle.images[0])}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${selectedImage === vehicle.images[0]
                                                    ? 'border-primary-500 scale-105'
                                                    : 'border-transparent hover:border-surface-highlight'
                                                    }`}
                                            >
                                                <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover" />
                                            </button>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-highlight">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-text-secondary hover:bg-surface-highlight transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    )
}
