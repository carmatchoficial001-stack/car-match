"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
    vehicleId?: string
    businessId?: string
    initialIsFavorited?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
    showText?: boolean,
    rounded?: string,
    onToggle?: (newState: boolean) => void
}

export default function FavoriteButton({
    vehicleId,
    businessId,
    initialIsFavorited = false,
    size = 'md',
    className = '',
    showText = false,
    rounded = 'rounded-full',
    onToggle
}: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
    const [isLoading, setIsLoading] = useState(false)
    const [animate, setAnimate] = useState(false)
    const router = useRouter()

    // Sincronizar con cambios en props (importante para refrescos de servidor)
    useEffect(() => {
        setIsFavorited(initialIsFavorited)
    }, [initialIsFavorited])

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5'
    }

    // Base width/height only if not showing text
    const iconOnlyClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    }

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-7 h-7'
    }

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isLoading) return

        // Proactive check for guest users
        // Since we don't have useSession here, we check if the interaction fails with 401
        // OR we could pass session as a prop if we want to be proactive.
        // For now, let's keep the reactive fix but ensure callbackUrl is used.

        // Optimistic update
        const newState = !isFavorited
        setIsFavorited(newState)
        setAnimate(true)

        // Reset animation class after it plays
        setTimeout(() => setAnimate(false), 300)

        if (onToggle) onToggle(newState)

        try {
            setIsLoading(true)

            const endpoint = vehicleId ? '/api/favorites' : '/api/businesses/favorites'
            const body = vehicleId ? { vehicleId } : { businessId }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (response.status === 401) {
                // Si no está autorizado, redirigir a login con callback
                setIsFavorited(!newState)
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
                router.push(`/auth?callbackUrl=${encodeURIComponent(currentPath)}`)
                return
            }

            if (!response.ok) {
                throw new Error('Error al actualizar favorito')
            }

            // Confirmar estado real del servidor
            const data = await response.json()
            let finalState = newState

            if (data.hasOwnProperty('isFavorite')) {
                finalState = data.isFavorite
            } else if (data.hasOwnProperty('isFavorited')) {
                finalState = data.isFavorited
            }

            setIsFavorited(finalState)
            if (onToggle) onToggle(finalState)

            // 🔄 Sincronizar con el servidor y otros componentes
            router.refresh()
            window.dispatchEvent(new CustomEvent('favoriteUpdated', {
                detail: { vehicleId, businessId, isFavorited: finalState }
            }))

        } catch (error) {
            console.error('Error:', error)
            // Revertir en caso de error
            setIsFavorited(!newState)
            if (onToggle) onToggle(!newState)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`
                flex items-center justify-center transition-all duration-200
                gap-2
                ${isFavorited
                    ? 'bg-white text-primary-700 shadow-md'
                    : 'bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm'
                }
                ${animate ? 'animate-like-burst' : ''}
                ${rounded}
                ${sizeClasses[size]}
                ${!showText ? iconOnlyClasses[size] : ''}
                ${className}
            `}
            aria-label={isFavorited ? "Quitar me gusta" : "Me gusta"}
        >
            <svg
                className={`${iconSizes[size]} transition-transform duration-200 ${animate ? 'scale-110' : 'scale-100'}`}
                fill={isFavorited ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isFavorited ? 0 : 2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
            </svg>
            {showText && (
                <span className="font-bold text-sm uppercase">
                    {isFavorited ? "Favorito" : "Me gusta"}
                </span>
            )}
        </button>
    )
}

