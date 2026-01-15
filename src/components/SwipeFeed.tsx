// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER
import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { X, ThumbsUp, MapPin } from 'lucide-react'
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
            exit={{
                x: exitX || (x.get() < 0 ? -1000 : 1000),
                opacity: 0,
                rotate: x.get() < 0 ? -45 : 45,
                transition: { duration: 1.0, ease: "easeInOut" }
            }}
            style={{
                x,
                rotate,
                opacity,
                position: 'absolute',
                width: '100%',
                height: '100%',
                // maxWidth: '420px', // Eliminado para permitir control por CSS del padre
                zIndex: isTop ? 10 : 0,
            }}
            className={`touch-none flex flex-col h-full ${!isTop && 'pointer-events-none'}`}
        >
            <div className="bg-surface/95 md:bg-surface/90 md:backdrop-blur-xl rounded-3xl shadow-2xl border border-surface-highlight overflow-hidden flex flex-col h-full">
                {/* Imagen Principal (Área Verde: Ver vehículo completo) */}
                <div className="relative w-full h-[50vh] md:h-[55vh] bg-black/40 overflow-hidden group">
                    {item.images && item.images[0] ? (
                        <>
                            {/* Blur Background para rellenar espacios si la foto no es panorámica */}
                            <img
                                src={item.images[0]}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
                            />
                            <img
                                src={item.images[0]}
                                alt={item.title}
                                className="relative w-full h-full object-contain z-10"
                                draggable={false}
                            />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-32 h-32 text-text-secondary opacity-30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                    )}

                    {isBusiness && (
                        <div className="absolute top-4 left-4 z-30 px-3 py-1 bg-primary-600 text-white text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1 uppercase tracking-widest">
                            <MapPin size={10} />
                            {t('swipe.business_badge')}
                        </div>
                    )}

                    <ReportImageButton
                        imageUrl={item.images?.[0] || ''}
                        vehicleId={!isBusiness ? item.id : undefined}
                        businessId={isBusiness ? item.id : undefined}
                        className="absolute top-4 right-4 z-30"
                    />

                    {/* Indicadores de swipe */}
                    <motion.div
                        className="absolute top-1/2 left-8 -translate-y-1/2 z-40"
                        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
                    >
                        <div className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold text-2xl rotate-12 border-4 border-white shadow-xl">
                            {t('swipe.overlay_like')}
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute top-1/2 right-8 -translate-y-1/2 z-40"
                        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
                    >
                        <div className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-2xl -rotate-12 border-4 border-white shadow-xl">
                            {t('swipe.overlay_nope')}
                        </div>
                    </motion.div>
                </div>

                {/* Área Roja: Información + Galería + Botones */}
                <div className="flex-1 flex flex-col justify-between bg-surface pt-4">
                    <div className="px-6">
                        <div className="flex items-start justify-between gap-4">
                            {/* Nombre y Precio */}
                            <div className="flex-1 min-w-0">
                                <Link href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`} onPointerDown={(e) => e.stopPropagation()}>
                                    <h2 className="text-xl md:text-2xl font-black text-text-primary hover:text-primary-400 transition cursor-pointer leading-tight line-clamp-2">
                                        {item.title} {item.year && <span className="font-light opacity-60 text-base ml-1">{item.year}</span>}
                                    </h2>
                                </Link>
                                {!isBusiness ? (
                                    <div className="text-xl md:text-2xl font-bold text-primary-500 mt-1">
                                        {formatPrice(item.price || 0, item.currency || 'MXN')}
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-primary-400 uppercase tracking-tighter bg-primary-900/20 px-2 py-1 rounded inline-block mt-1">
                                        {item.category || 'Negocio'}
                                    </div>
                                )}
                                <div className="mt-2 flex items-center gap-1.5 text-text-secondary text-xs">
                                    <MapPin size={12} className="text-primary-500" />
                                    <span className="font-medium truncate">{item.city}</span>
                                </div>
                            </div>

                            {/* Galería Compacta */}
                            {item.images && item.images.length > 1 && (
                                <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
                                    {item.images.slice(1, 4).map((img, idx) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/5 shadow-inner">
                                            <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />
                                        </div>
                                    ))}
                                    {item.images.length > 4 && (
                                        <div className="w-12 h-12 rounded-lg bg-surface-highlight flex items-center justify-center text-[10px] font-bold text-text-secondary border border-white/5">
                                            +{item.images.length - 4}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones de Acción (Al final de la tarjeta) */}
                    <div className="px-6 pb-6 mt-4">
                        <div className="flex justify-end mb-3">
                            <Link
                                href={isBusiness ? `/map-store?id=${item.id}` : `/vehicle/${item.id}`}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-sm font-bold text-primary-500 hover:text-primary-400 transition flex items-center gap-1"
                            >
                                {t('swipe.view_more')} &rarr;
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onSwipe('left')}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-highlight border border-white/5 text-red-500 font-bold hover:bg-red-500/10 transition-all active:scale-95"
                            >
                                <X size={20} />
                                <span>{t('swipe.nope_btn')}</span>
                            </button>
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onSwipe('right')}
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-900/20 hover:bg-primary-500 transition-all active:scale-95"
                            >
                                <ThumbsUp size={20} />
                                <span>{t('swipe.like_btn')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
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

        setTimeout(() => {
            if (swipeDirection === 'right') {
                onLike(currentItem.id)
            } else {
                onDislike(currentItem.id)
            }

            setExitX(undefined)
            setIsSwiping(false)
        }, 1000)
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
            </div>
        )
    }

    return (
        <div className="relative w-full sm:max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col h-full min-h-[75vh]">
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
                    <div className="absolute w-full h-full sm:max-w-md md:max-w-2xl lg:max-w-3xl pointer-events-none -z-10 scale-[0.98] translate-y-4 opacity-70">
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
