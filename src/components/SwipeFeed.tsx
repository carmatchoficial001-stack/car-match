// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER
import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { X, ThumbsUp, MapPin, Plus } from 'lucide-react'

import Link from 'next/link'
import ContactButton from './ContactButton'
import ShareButton from './ShareButton'
import ReportImageButton from './ReportImageButton'
import { formatPrice } from '@/lib/vehicleTaxonomy'
import { useLanguage } from '@/contexts/LanguageContext'

interface FeedItem {
    id: string
    title: string
    brand?: string
    model?: string
    category?: string
    year?: number
    price?: number
    currency?: string | null
    city: string
    images?: string[]
    feedType?: 'VEHICLE' | 'BUSINESS'
    user: {
        name: string
        image: string | null
    }
    _count?: {
        favorites: number
    }
}

interface SwipeCardProps {
    item: FeedItem
    onSwipe: (direction: 'left' | 'right') => void
    isTop: boolean
    exitX?: number
}

function SwipeCard({ item, onSwipe, isTop, exitX }: SwipeCardProps) {
    const { t } = useLanguage()
    const [activeImage, setActiveImage] = useState(0)
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100

        if (info.offset.x > threshold) {
            onSwipe('right')
        } else if (info.offset.x < -threshold) {
            onSwipe('left')
        }
    }

    const isBusiness = item.feedType === 'BUSINESS'

    return (
        <motion.div
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: isTop ? 1 : 0.95, opacity: 1, y: isTop ? 0 : 10 }}
            style={{
                x,
                rotate,
                opacity,
                position: 'absolute',
                width: '100%',
                height: 'auto',
                maxHeight: '100%',
                zIndex: isTop ? 10 : 0,
            }}
            exit={{
                x: exitX !== undefined ? exitX : (x.get() <= 0 ? -1000 : 1000),
                opacity: 0,
                rotate: x.get() <= 0 ? -45 : 45,
                transition: { duration: 0.4, ease: "easeOut" }
            }}
            className={`touch-none flex flex-col h-auto max-h-full ${!isTop && 'pointer-events-none'}`}
        >
            <div className="bg-surface rounded-3xl shadow-2xl border border-surface-highlight overflow-hidden flex flex-col h-auto max-h-full">
                {/* Imagen Principal (Original Size Restored) */}
                <div className="relative w-full h-[45vh] sm:h-[45vh] lg:h-[50vh] bg-gradient-to-br from-surface-highlight to-surface overflow-hidden">
                    <Link
                        href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="block w-full h-full"
                    >
                        {item.images && item.images[activeImage] ? (
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImage}
                                    src={item.images[activeImage]}
                                    alt={item.title}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full object-contain bg-black/40"
                                    draggable={false}
                                />
                            </AnimatePresence>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-32 h-32 text-text-secondary opacity-30" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                            </div>
                        )}
                    </Link>

                    {isBusiness && (
                        <div className="absolute top-4 left-4 z-30 px-3 py-1 bg-primary-600 text-white text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
                            <MapPin size={10} />
                            {t('swipe.business_badge')}
                        </div>
                    )}

                    <ReportImageButton
                        imageUrl={item.images?.[activeImage] || ''}
                        vehicleId={!isBusiness ? item.id : undefined}
                        businessId={isBusiness ? item.id : undefined}
                        className="absolute top-4 right-4 z-30"
                    />

                    {/* Indicadores de swipe (Overlay en la imagen) */}
                    <motion.div
                        className="absolute top-8 left-8 z-40 pointer-events-none"
                        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                    >
                        <div className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold text-2xl rotate-12 border-4 border-white shadow-xl">
                            {t('swipe.overlay_like')}
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute top-8 right-8 z-40 pointer-events-none"
                        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                    >
                        <div className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-2xl -rotate-12 border-4 border-white shadow-xl">
                            {t('swipe.overlay_nope')}
                        </div>
                    </motion.div>
                </div>

                {/* Contenido Inferior: Info + Galería + Botones */}
                <div className="flex flex-col bg-surface pt-4">
                    {/* 1. Nombre y Año */}
                    <div className="px-6 mb-1">
                        <Link href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`} onPointerDown={(e) => e.stopPropagation()}>
                            <h2 className="text-2xl font-bold text-text-primary hover:text-primary-400 transition cursor-pointer leading-tight line-clamp-2">
                                {item.title}
                            </h2>
                        </Link>
                    </div>

                    {/* 2. Precio */}
                    <div className="px-6 mb-1">
                        <Link
                            href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="block"
                        >
                            {!isBusiness ? (
                                <div className="text-2xl font-bold text-primary-500">
                                    {formatPrice(item.price || 0, item.currency || 'MXN')}
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-primary-400 uppercase tracking-tighter bg-primary-900/20 px-2 py-1 rounded inline-block">
                                    {item.category || 'Negocio'}
                                </div>
                            )}
                        </Link>
                    </div>

                    <Link
                        href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="px-6 mb-2 flex items-center gap-2 text-text-secondary text-xs sm:text-sm hover:text-primary-400 transition"
                    >
                        <MapPin size={14} className="text-primary-500" />
                        <span className="font-medium">{item.city}</span>
                    </Link>

                    {/* 4. Galería de Fotos (Miniaturas) */}
                    {item.images && item.images.length > 1 && (
                        <div className="px-6 mb-2">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade">
                                {item.images.slice(0, 5).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary-500 scale-105 shadow-glow-sm' : 'border-surface-highlight opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} draggable={false} />
                                    </button>
                                ))}
                                {item.images.length > 5 && (
                                    <Link
                                        href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="w-16 h-16 flex-shrink-0 rounded-lg bg-surface-highlight flex items-center justify-center text-xs font-bold text-text-secondary border border-surface-highlight hover:bg-surface-highlight/80 transition"
                                    >
                                        +{item.images.length - 5}
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 5. Ver más */}
                    <div className="flex justify-end px-6 mb-2">
                        <Link
                            href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-lg font-bold text-primary-500 hover:text-primary-400 transition flex items-center gap-1"
                        >
                            {t('swipe.view_more')} &rarr;
                        </Link>
                    </div>

                    {/* 6. Botones de Acción */}
                    <div className="grid grid-cols-2 gap-4 px-6 pb-6 mt-auto">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => {
                                x.set(-1) // Nudge for exit logic
                                onSwipe('left')
                            }}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-highlight border-2 border-surface-highlight text-red-400 font-bold text-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 shadow-sm"
                        >
                            <X size={24} />
                            <span>{t('swipe.nope_btn')}</span>
                        </button>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => {
                                x.set(1) // Nudge for exit logic
                                onSwipe('right')
                            }}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-500 transition-all active:scale-95 shadow-lg shadow-primary-900/20"
                        >
                            <ThumbsUp size={24} />
                            <span>{t('swipe.like_btn')}</span>
                        </button>
                    </div>
                </div>
            </div >
        </motion.div >
    )
}

interface SwipeFeedProps {
    items: FeedItem[]
    onLike: (id: string) => void
    onDislike: (id: string) => void
    onNeedMore: () => void
}

export default function SwipeFeed({ items, onLike, onDislike, onNeedMore }: SwipeFeedProps) {
    const { t } = useLanguage()
    const [isSwiping, setIsSwiping] = useState(false)
    const [exitX, setExitX] = useState<number | undefined>(undefined)

    const handleSwipe = (swipeDirection: 'left' | 'right') => {
        if (isSwiping || items.length === 0) return

        const currentItem = items[0]
        setIsSwiping(true)
        setExitX(swipeDirection === 'left' ? -1000 : 1000)

        // Ejecutar acción inmediatamente
        if (swipeDirection === 'right') {
            onLike(currentItem.id)
        } else {
            onDislike(currentItem.id)
        }

        // Resetear estado ligeramente después para permitir que la animación respire
        setTimeout(() => {
            setExitX(undefined)
            setIsSwiping(false)
        }, 300)
    }

    const currentItem = items[0]
    const nextItem = items[1]

    if (items.length === 0 && !isSwiping) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-[70vh]">
                <div className="w-24 h-24 bg-surface-highlight rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">
                    {t('swipe.seen_all_title')}
                </h2>
                <p className="text-text-secondary mb-8 max-w-md">
                    {t('swipe.seen_all_desc')}
                </p>
                <button
                    onClick={onNeedMore}
                    className="px-8 py-4 bg-primary-700 text-text-primary rounded-xl font-bold text-lg hover:bg-primary-600 transition flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 transform"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('swipe.expand_btn')}
                </button>


                <div className="mt-8 pt-8 border-t border-white/10 w-full flex flex-col items-center">
                    <p className="text-sm text-text-secondary mb-4">{t('market.cant_find_desc')}</p>
                    <Link
                        href="/publish"
                        className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:bg-white/90 transition flex items-center gap-2 shadow-xl"
                    >
                        <Plus size={20} />
                        {t('swipe.publish') || t('market.publish_cta')}
                    </Link>
                </div>
            </div >

        )
    }

    return (
        <div className="relative w-full sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex flex-col h-full min-h-[75vh]">
            <div className="relative flex-1 h-full flex justify-center perspective-1000">
                <AnimatePresence mode="popLayout">
                    {currentItem && (
                        <SwipeCard
                            key={currentItem.id}
                            item={currentItem}
                            onSwipe={handleSwipe}
                            isTop={true}
                            exitX={exitX}
                        />
                    )}
                </AnimatePresence>

                {nextItem && (
                    <div className="absolute w-full h-full sm:max-w-md md:max-w-xl lg:max-w-2xl pointer-events-none -z-10 scale-[0.98] translate-y-4 opacity-70">
                        <SwipeCard
                            key={nextItem.id}
                            item={nextItem}
                            onSwipe={() => { }}
                            isTop={false}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
