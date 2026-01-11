"use client"

import { useState } from 'react'
import { Business, Vehicle } from '@prisma/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { Instagram } from 'lucide-react'

// Extended interface to handle optional relations if needed, 
// though we'll primarily use the Prisma Business type for consistency
// But since we are receiving 'any' from the parent often, we define a loose interface compatible with Prisma
interface BusinessData {
    id: string
    name: string
    category: string
    description?: string | null
    phone?: string | null
    whatsapp?: string | null
    website?: string | null
    facebook?: string | null
    instagram?: string | null
    tiktok?: string | null
    telegram?: string | null
    images: string[]
    city: string
    address: string
    street?: string | null
    streetNumber?: string | null
    colony?: string | null
    state?: string | null
    hours?: string | null
    services?: string[]
    additionalPhones?: string[]
    latitude?: number | null
    longitude?: number | null
    is24Hours?: boolean
    hasEmergencyService?: boolean
    hasHomeService?: boolean
}

interface BusinessDetailsModalProps {
    business: BusinessData
    onClose: () => void
    categoryColor?: string
    categoryEmoji?: string
}

export default function BusinessDetailsModal({ business, onClose, categoryColor = '#3b82f6', categoryEmoji = '🔧' }: BusinessDetailsModalProps) {
    const { t } = useLanguage()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (business.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % business.images.length)
        }
    }

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (business.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + business.images.length) % business.images.length)
        }
    }

    if (!business) return null

    // Helper to format full address
    const fullAddress = [
        business.street ? `${business.street} ${business.streetNumber || ''} ` : '',
        business.colony,
        business.city,
        business.state
    ].filter(Boolean).join(', ') || business.address

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface border border-surface-highlight rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ❌ Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition backdrop-blur-md"
                >
                    ✕
                </button>

                {/* 🖼️ Image Gallery */}
                <div className="relative w-full h-72 sm:h-96 bg-gray-900 group">
                    {business.images && business.images.length > 0 ? (
                        <>
                            <img
                                src={business.images[currentImageIndex]}
                                alt={business.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Navigation Arrows */}
                            {business.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
                                    >
                                        ◀
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
                                    >
                                        ▶
                                    </button>
                                    {/* Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {business.images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w - 2 h - 2 rounded - full transition - all shadow - sm ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'} `}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                            <span className="text-6xl">{categoryEmoji}</span>
                        </div>
                    )}

                    {/* Category Badge overlay */}
                    <div className="absolute bottom-4 left-4">
                        <span
                            className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2 backdrop-blur-md bg-black/30 border border-white/20"
                            style={{ borderColor: categoryColor }}
                        >
                            <span className="text-lg">{categoryEmoji}</span>
                            <span className="tracking-wider">{(t(`map_store.categories.${business.category.toLowerCase()}`) || business.category).toUpperCase()}</span>
                        </span>
                    </div>
                </div>

                {/* 📝 Content */}
                <div className="p-6 md:p-8 space-y-8 pb-32">
                    {/* Header Info */}
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary mb-2 leading-tight">{business.name}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text-secondary text-sm">
                            {business.city && (
                                <p className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {business.city}, {business.state || 'MX'}
                                </p>
                            )}
                            {business.website && (
                                <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                    {t('business_details.website')}
                                </a>
                            )}

                        </div>

                        {/* [NEW] Feature Badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {business.is24Hours && (
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 flex items-center gap-1">
                                    {t('business_details.features.24_hours')}
                                </span>
                            )}
                            {business.hasEmergencyService && (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-full border border-red-500/30 flex items-center gap-1">
                                    {t('business_details.features.emergency')}
                                </span>
                            )}
                            {business.hasHomeService && (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/30 flex items-center gap-1">
                                    {t('business_details.features.home_service')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* WhatsApp (Múltiples números) */}
                        {business.whatsapp && business.whatsapp.split(/[,/|]/).map((wa, idx) => {
                            const cleanNumber = wa.replace(/\D/g, '');
                            if (!cleanNumber) return null;
                            return (
                                <a
                                    key={`wa-${idx}`}
                                    href={`https://wa.me/${cleanNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="col-span-2 sm:col-span-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition transform hover:scale-[1.02] shadow-lg shadow-green-900/20"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                    WhatsApp {idx > 0 && idx + 1}
                                </a >
                            );
                        })}

                        {/* Teléfono */}
                        {
                            business.phone && (
                                <a
                                    href={`tel:${business.phone}`}
                                    className="col-span-2 sm:col-span-1 bg-surface-highlight hover:bg-surface-highlight/80 text-text-primary border border-white/10 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {t('business_details.call')}
                                </a>
                            )
                        }

                        {/* Telegram (Múltiples o único) */}
                        {business.telegram && business.telegram.split(/[,/|]/).map((tg, idx) => {
                            const username = tg.trim().replace('@', '');
                            if (!username) return null;
                            return (
                                <a
                                    key={`tg-${idx}`}
                                    href={`https://t.me/${username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="col-span-2 sm:col-span-1 bg-[#0088cc] hover:bg-[#0077b5] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition transform hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                                >
                                    {/* Simple Plane/Send Icon inline */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    Telegram {idx > 0 && idx + 1}
                                </a>
                            )
                        })}

                        {/* Redes Sociales */}
                        <div className="col-span-2 flex gap-2">
                            {business.facebook && (
                                <a href={business.facebook} target="_blank" className="flex-1 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 py-3 rounded-xl flex items-center justify-center transition">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                            )}
                            {business.instagram && (
                                <a href={business.instagram} target="_blank" className="flex-1 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-90 py-3 rounded-xl flex items-center justify-center transition shadow-lg shadow-pink-900/20" title="Instagram">
                                    <Instagram className="w-6 h-6" />
                                </a>
                            )}
                            {business.tiktok && (
                                <a href={business.tiktok} target="_blank" className="flex-1 bg-black hover:bg-gray-900 text-white border border-white/10 py-3 rounded-xl flex items-center justify-center transition shadow-lg relative overflow-hidden group/tiktok">
                                    <svg className="w-6 h-6 z-10" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* 📄 Description */}
                        {business.description && (
                            <div className="bg-surface-highlight/30 p-5 rounded-2xl">
                                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {t('business_details.about')}
                                </h3>
                                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                    {business.description}
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* 📍 Info Details */}
                            {fullAddress && (
                                <div className="bg-surface-highlight/30 p-4 rounded-2xl">
                                    <h3 className="font-bold text-text-primary mb-2 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {t('business_details.location')}
                                    </h3>
                                    <p className="text-text-secondary text-sm mb-3">
                                        {fullAddress}
                                    </p>

                                    {/* Navigation Buttons */}
                                    {business.latitude && business.longitude && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {/* Ver en Mapa de CarMatch */}
                                            <a
                                                href={`/map?lat=${business.latitude}&lng=${business.longitude}&category=${business.category}&highlight=${business.id}`}
                                                className="px-3 py-2 bg-primary-700/20 hover:bg-primary-700/30 text-primary-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border border-primary-700/30"
                                                onClick={onClose}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                {t('business_details.view_map')}
                                            </a>

                                            {/* Navegar en Google Maps */}
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition border border-blue-500/30"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                {t('business_details.navigate_gps')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {business.hours && (
                                <div className="bg-surface-highlight/30 p-4 rounded-2xl">
                                    <h3 className="font-bold text-text-primary mb-2 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {t('business_details.hours')}
                                    </h3>
                                    <p className="text-text-secondary text-sm whitespace-pre-line">
                                        {business.hours}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🛠️ Servicios */}
                    {
                        business.services && business.services.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-surface-highlight/50">
                                <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                    {t('business_details.services')}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {business.services.map((service, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-surface-highlight/30 text-text-secondary text-xs rounded-full border border-surface-highlight">
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    {/* ⚙️ Footer Info - Hidden by request
                    <div className="pt-4 border-t border-surface-highlight/50 flex justify-between items-center text-xs text-text-secondary">
                        <span>ID: {business.id.slice(-6).toUpperCase()}</span>
                    </div>
                    */}

                </div >
            </div >
        </div >
    )
}
