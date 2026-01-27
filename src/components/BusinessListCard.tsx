'use client'

import { MapPin, Phone, Globe, Navigation, MessageCircle, Star } from 'lucide-react'
import { getBusinessStatus } from '@/lib/businessTimeUtils'
import CategoryIcon from './CategoryIcon'
import { BUSINESS_CATEGORIES } from '@/lib/businessCategories'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessListCardProps {
    business: {
        id: string
        name: string
        category: string
        address: string
        phone?: string | null
        website?: string | null
        hours?: string | null
        is24Hours: boolean
        latitude: number
        longitude: number
        images: string[]
        distance?: string // Opcional, calculado si hay ubicación
    }
    isActive?: boolean
    onClick?: () => void
    onActionClick?: (action: string) => void
}

export default function BusinessListCard({ business, isActive, onClick }: BusinessListCardProps) {
    const { t } = useLanguage()
    const status = getBusinessStatus(business.hours || null, business.is24Hours)
    const categoryData = BUSINESS_CATEGORIES.find(c => c.id === business.category)

    // Simular rating para estética tipo Google
    const rating = (Math.random() * (5 - 4) + 4).toFixed(1)
    const totalReviews = Math.floor(Math.random() * 500) + 10

    const handleDirections = (e: React.MouseEvent) => {
        e.stopPropagation()
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`, '_blank')
    }

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (business.phone) window.location.href = `tel:${business.phone}`
    }

    const handleWebsite = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (business.website) window.open(business.website, '_blank')
    }

    return (
        <div
            onClick={onClick}
            className={`p-4 border-b border-surface-highlight cursor-pointer transition-all hover:bg-surface-highlight/40 ${isActive ? 'bg-primary-900/10 border-l-4 border-l-primary-600' : ''}`}
        >
            <div className="flex gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-text-primary leading-tight truncate">
                        {business.name}
                    </h3>

                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-sm font-bold text-amber-500">{rating}</span>
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={12} fill={s <= Math.floor(Number(rating)) ? "currentColor" : "none"} className="text-amber-500" />
                            ))}
                        </div>
                        <span className="text-xs text-text-secondary">({totalReviews})</span>
                    </div>

                    <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
                        <CategoryIcon iconName={categoryData?.icon || 'Wrench'} size={14} className="opacity-70" />
                        <span className="capitalize">{t(`map_store.categories.${business.category}`) || business.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className={status.isOpen ? 'text-green-500 font-bold' : 'text-red-500'}>
                            {status.statusText}
                        </span>
                        {status.isOpen && <span className="text-xs opacity-70">· {status.nextAction}</span>}
                    </p>

                    <p className="text-xs text-text-secondary mt-1 flex items-start gap-1">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{business.address}</span>
                    </p>

                    {/* Quick Labels */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleCall}
                            disabled={!business.phone}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition ${business.phone ? 'border-primary-500/30 bg-primary-500/5 text-primary-400 hover:bg-primary-500/10' : 'border-surface-highlight opacity-30 cursor-not-allowed'}`}
                        >
                            <Phone size={18} />
                            <span className="text-[10px] font-black uppercase">Llamar</span>
                        </button>

                        <button
                            onClick={handleDirections}
                            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-400 hover:bg-primary-500/10 transition"
                        >
                            <Navigation size={18} />
                            <span className="text-[10px] font-black uppercase">Ruta</span>
                        </button>

                        <button
                            onClick={handleWebsite}
                            disabled={!business.website}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition ${business.website ? 'border-primary-500/30 bg-primary-500/5 text-primary-400 hover:bg-primary-500/10' : 'border-surface-highlight opacity-30 cursor-not-allowed'}`}
                        >
                            <Globe size={18} />
                            <span className="text-[10px] font-black uppercase">Web</span>
                        </button>
                    </div>
                </div>

                {/* Mini Image */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-highlight flex-shrink-0 border border-white/5">
                    {business.images?.[0] ? (
                        <img
                            src={business.images[0]}
                            alt={business.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-700/10 text-primary-400 font-black text-2xl">
                            <CategoryIcon iconName={categoryData?.icon || 'Wrench'} size={32} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
