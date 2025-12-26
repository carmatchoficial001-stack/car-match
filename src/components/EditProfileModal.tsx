"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: {
        name: string | null
        image: string | null
    }
    userVehicles: any[] // Lista de vehículos del usuario para usar como foto
}

// Lista de avatares predefinidos (Autos de alta calidad)
const PREDEFINED_AVATARS = [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=200", // Deportivo Azul
    "https://images.unsplash.com/photo-1583121274602-3e2820c698d9?auto=format&fit=crop&q=80&w=200", // Rojo Clásico
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200", // SUV Elegante
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=200", // Convertible
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=200", // Supercar
    "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=200", // Deportivo Plata
]

export default function EditProfileModal({ isOpen, onClose, currentUser, userVehicles }: EditProfileModalProps) {
    const router = useRouter()
    const [name, setName] = useState(currentUser.name || '')
    const [selectedImage, setSelectedImage] = useState(currentUser.image || '')
    const [loading, setLoading] = useState(false)

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
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="off"
                            data-lpignore="true"
                            className="w-full bg-background border border-surface-highlight rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary-500 outline-none transition"
                            placeholder="Ej: Juan Pérez"
                        />
                        <div className="mt-3 p-3 bg-primary-900/20 border border-primary-900/30 rounded-lg">
                            <p className="text-xs text-primary-300">
                                💡 <strong>Idea Creativa:</strong> ¿Por qué no usar un nombre divertido? <br />
                                Ejemplos: <em>"El Garaje de {currentUser.name?.split(' ')[0] || 'Ana'}", "Autos del Norte", "La Colección de {currentUser.name?.split(' ')[0] || 'Mike'}"</em>
                            </p>
                        </div>
                    </div>

                    {/* Sección Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">
                            Foto de Perfil
                        </label>

                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {PREDEFINED_AVATARS.map((avatar, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedImage(avatar)}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${selectedImage === avatar
                                        ? 'border-primary-500 scale-105'
                                        : 'border-transparent hover:border-surface-highlight'
                                        }`}
                                >
                                    <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                                    {selectedImage === avatar && (
                                        <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
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
            </div>
        </div>
    )
}
