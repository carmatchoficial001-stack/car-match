import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import ImageUpload from './ImageUpload'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentUser: {
        name: string | null
        image: string | null
        email?: string | null
        trustedContactId?: string | null
        trustedContact?: { id: string, name: string } | null
    }
    userVehicles: any[] // Lista de vehículos del usuario para usar como foto
}



export default function EditProfileModal({ isOpen, onClose, currentUser, userVehicles }: EditProfileModalProps) {
    const router = useRouter()
    const t = useTranslations('edit_profile')
    const [name, setName] = useState(currentUser.name || '')
    const [selectedImage, setSelectedImage] = useState(currentUser.image || '')
    const [trustedContactId, setTrustedContactId] = useState(currentUser.trustedContactId || '')
    const [trustedContactName, setTrustedContactName] = useState(currentUser.trustedContact?.name || '')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
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
                body: JSON.stringify({ name, image: selectedImage, trustedContactId })
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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

                <h2 className="text-2xl font-bold text-text-primary mb-6">{t('title')}</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sección Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            {t('name_label')}
                        </label>

                        {/* Tip movido arriba por solicitud del usuario */}
                        <div className="mb-3 p-3 bg-primary-900/20 border border-primary-900/30 rounded-lg">
                            <p className="text-xs text-primary-300">
                                💡 <strong>{t('creative_idea')}</strong> {t('creative_desc')} <br />
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
                            {/* Validator de imagen oculto */}
                            {selectedImage && (selectedImage.startsWith('http') || selectedImage.startsWith('/')) && (
                                <img
                                    src={selectedImage}
                                    className="hidden"
                                    onError={() => setImageError(true)}
                                    onLoad={() => setImageError(false)}
                                    alt=""
                                />
                            )}

                            <ImageUpload
                                label={(!hasValidImage) ? t('upload_first') : t('change_photo')}
                                images={hasValidImage ? [selectedImage] : []}
                                onImagesChange={(imgs) => {
                                    setSelectedImage(imgs[0] || '')
                                    setImageError(false)
                                }}
                                maxImages={1}
                                required={false}
                                imageType="profile" // 🛡️ Moderación de perfil activada
                                fallbackContent={
                                    <div className="border-2 border-dashed border-surface-highlight rounded-lg p-4">
                                        <p className="text-xs text-text-secondary text-center mb-3">
                                            {t('current_profile_desc')}
                                        </p>
                                        <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-surface-highlight bg-surface mx-auto">
                                            <img
                                                src={`/defaults/avatars/car_${((currentUser.name?.charCodeAt(0) || 0) % 6) + 1}.png`}
                                                alt="Avatar temporal"
                                                className="w-full h-full object-cover opacity-90"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                                <span className="mt-8 text-5xl font-bold text-white drop-shadow-lg tracking-wider">
                                                    {initial}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                            <div className="mt-2 text-xs text-blue-300 bg-blue-900/20 border border-blue-900/30 p-2 rounded-lg flex items-start gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    <strong>{t('recommendation')}</strong> {t('recommendation_full')}
                                </span>
                            </div>
                        </div>



                        {/* Vehículos del Usuario (si tiene) */}
                        {userVehicles.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider font-bold">{t('your_vehicles')}</p>
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

                    {/* SECCIÓN SOS: Contacto de Confianza */}
                    <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-3zM12 9l-.01.01" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-red-400 font-bold">{t('security_sos')}</h3>
                                <p className="text-[10px] text-text-secondary">{t('sos_desc')}</p>
                            </div>
                        </div>

                        {trustedContactName ? (
                            <div className="bg-surface/50 p-3 rounded-xl border border-red-500/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                                        {trustedContactName[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm font-bold text-text-primary">{trustedContactName}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTrustedContactId('');
                                        setTrustedContactName('');
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                                >
                                    {t('remove')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t('search_user')}
                                        className="w-full bg-background border border-surface-highlight rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-red-500/50 transition"
                                        value={searchQuery}
                                        onChange={async (e) => {
                                            const val = e.target.value;
                                            setSearchQuery(val);
                                            if (val.length >= 3) {
                                                setSearching(true);
                                                try {
                                                    const res = await fetch(`/api/user/search?q=${val}`);
                                                    const data = await res.json();
                                                    setSearchResults(data.users || []);
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setSearching(false);
                                                }
                                            } else {
                                                setSearchResults([]);
                                            }
                                        }}
                                    />
                                    {searching && (
                                        <div className="absolute right-3 top-3">
                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-lg animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="bg-background border border-surface-highlight rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                                        {searchResults.map((user: any) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    setTrustedContactId(user.id);
                                                    setTrustedContactName(user.name);
                                                    setSearchResults([]);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full p-3 flex items-center gap-3 hover:bg-surface-highlight transition text-left"
                                            >
                                                {user.image ? (
                                                    <img src={user.image} className="w-8 h-8 rounded-lg object-cover" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                                                        {user.name[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-text-primary">{user.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-[9px] text-text-secondary italic">
                            💡 {t('sos_warning')}
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-highlight">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-text-secondary hover:bg-surface-highlight transition"
                        >
                            {t('cancel')}
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
                                    {t('saving')}
                                </>
                            ) : (
                                t('save_changes')
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    )
}
