// ✅ DISEÑO DE TARJETAS VALIDADO - ASÍ DEBE SER
import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { X, ThumbsUp, MapPin } from 'lucide-react'
import Link from 'next/link'
import ContactButton from './ContactButton'
import ShareButton from './ShareButton'
import { formatPrice } from '@/lib/vehicleTaxonomy'

interface Vehicle {
    id: string
    title: string
    brand: string
    model: string
    year: number
    price: number
    currency?: string | null
    city: string
    images?: string[]
    user: {
        name: string
        image: string | null
    }
    _count: {
        favorites: number
    }
}

interface SwipeCardProps {
    vehicle: Vehicle
    onSwipe: (direction: 'left' | 'right') => void
    isTop: boolean
    exitX?: number
}

function SwipeCard({ vehicle, onSwipe, isTop, exitX }: SwipeCardProps) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100

        if (info.offset.x > threshold) {
            // Swipe derecha = Like
            onSwipe('right')
        } else if (info.offset.x < -threshold) {
            // Swipe izquierda = Dislike
            onSwipe('left')
        }
    }

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
                transition: { duration: 0.4 }
            }}
            style={{
                x,
                rotate,
                opacity,
                position: 'absolute',
                width: '100%',
                height: '100%',
                maxWidth: '420px',
                zIndex: isTop ? 10 : 0,
            }}
            className={`touch-none flex flex-col h-full ${!isTop && 'pointer-events-none'}`}
        >
            <div className="bg-surface rounded-3xl shadow-2xl border border-surface-highlight overflow-hidden flex flex-col h-full">
                {/* Imagen */}
                <div className="relative flex-1 min-h-0 bg-gradient-to-br from-surface-highlight to-surface overflow-hidden">
                    {vehicle.images && vehicle.images[0] ? (
                        <img
                            src={vehicle.images[0]}
                            alt={vehicle.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-32 h-32 text-text-secondary opacity-30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                    )}



                    {/* Indicadores de swipe */}
                    <motion.div
                        className="absolute top-8 left-8"
                        style={{
                            opacity: useTransform(x, [0, 100], [0, 1]),
                        }}
                    >
                        <div className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold text-2xl rotate-12 border-4 border-white shadow-xl">
                            ME GUSTA
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute top-8 right-8"
                        style={{
                            opacity: useTransform(x, [-100, 0], [1, 0]),
                        }}
                    >
                        <div className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-2xl -rotate-12 border-4 border-white shadow-xl">
                            NOPE
                        </div>
                    </motion.div>
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <Link href={`/vehicle/${vehicle.id}`} onPointerDown={(e) => e.stopPropagation()}>
                                <h2 className="text-2xl font-bold text-text-primary mb-2 hover:text-primary-400 transition cursor-pointer leading-tight">
                                    {vehicle.title}
                                </h2>
                            </Link>
                            <ShareButton
                                title={vehicle.title}
                                text={`¡Mira este ${vehicle.title} en CarMatch!`}
                                url={`https://carmatch.app/vehicle/${vehicle.id}`}
                                variant="minimal"
                                className="z-20 opacity-70 hover:opacity-100 transition"
                            />
                            <div className="flex items-center gap-1 text-xs text-text-secondary mt-1 opacity-60">
                                <MapPin size={12} />
                                <span>{vehicle.city}</span>
                            </div>
                        </div>
                        <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-primary-700">
                                {formatPrice(vehicle.price, vehicle.currency || 'MXN')}
                            </div>
                            <Link
                                href={`/vehicle/${vehicle.id}`}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-sm text-primary-400 hover:underline font-medium"
                            >
                                Ver más
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

interface SwipeFeedProps {
    vehicles: Vehicle[]
    onLike: (vehicleId: string) => void
    onDislike: (vehicleId: string) => void
    onNeedMore: () => void
}

export default function SwipeFeed({ vehicles, onLike, onDislike, onNeedMore }: SwipeFeedProps) {
    const [isSwiping, setIsSwiping] = useState(false)
    const [exitX, setExitX] = useState<number | undefined>(undefined)

    const handleSwipe = (swipeDirection: 'left' | 'right') => {
        if (isSwiping || vehicles.length === 0) return

        const currentVehicle = vehicles[0]
        setIsSwiping(true)
        setExitX(swipeDirection === 'left' ? -1000 : 1000)

        // Wait for exit animation to halfway complete before unlocking
        setTimeout(() => {
            // Trigger external callbacks AFTER animation to prevent list jump/flash
            if (swipeDirection === 'right') {
                onLike(currentVehicle.id)
            } else {
                onDislike(currentVehicle.id)
            }

            setExitX(undefined)
            setIsSwiping(false)
        }, 400) // Reduced slightly to feel snappier but safe
    }

    const currentVehicle = vehicles[0]
    const nextVehicle = vehicles[1]

    // Si ya no hay más vehículos
    if (vehicles.length === 0 && !isSwiping) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-24 h-24 bg-surface-highlight rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">
                    ¡Has visto todos los carros cercanos!
                </h2>
                <p className="text-text-secondary mb-8 max-w-md">
                    Expande tu búsqueda para descubrir más vehículos en tu zona
                </p>
                <button
                    onClick={onNeedMore}
                    className="px-8 py-4 bg-primary-700 text-text-primary rounded-xl font-bold text-lg hover:bg-primary-600 transition flex items-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Expandir Búsqueda
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-[420px] mx-auto flex flex-col h-full min-h-[500px]">
            {/* Container de cards */}
            <div className="relative flex-1 mb-4 h-[500px] md:h-[600px] flex justify-center">
                <AnimatePresence mode="popLayout">
                    {/* Current card (top) */}
                    {currentVehicle && (
                        <SwipeCard
                            key={currentVehicle.id}
                            vehicle={currentVehicle}
                            onSwipe={handleSwipe}
                            isTop={true}
                            exitX={exitX}
                        />
                    )}
                </AnimatePresence>

                {/* Next card (background - consistently visible underneath) */}
                {nextVehicle && (
                    <div className="absolute w-full h-full max-w-[420px] pointer-events-none -z-10">
                        <SwipeCard
                            key={nextVehicle.id}
                            vehicle={nextVehicle}
                            onSwipe={() => { }}
                            isTop={false}
                        />
                    </div>
                )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center gap-6 mt-8">
                <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 rounded-full flex items-center justify-center transition"
                >
                    <X size={32} className="text-red-500" />
                </button>

                <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 bg-green-500/20 hover:bg-green-500/30 border-2 border-green-500 rounded-full flex items-center justify-center transition"
                >
                    <ThumbsUp size={28} className="text-green-500" />
                </button>
            </div>
        </div>
    )
}
