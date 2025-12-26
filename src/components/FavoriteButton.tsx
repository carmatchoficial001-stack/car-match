"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
    vehicleId: string
    initialIsFavorited?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
    onToggle?: (newState: boolean) => void
}

export default function FavoriteButton({
    vehicleId,
    initialIsFavorited = false,
    size = 'md',
    className = '',
    onToggle
}: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
    const [isLoading, setIsLoading] = useState(false)
    const [animate, setAnimate] = useState(false)
    const router = useRouter()

    const sizeClasses = {
        sm: 'w-8 h-8 p-1.5',
        md: 'w-10 h-10 p-2',
        lg: 'w-12 h-12 p-2.5'
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

        // Optimistic update
        const newState = !isFavorited
        setIsFavorited(newState)
        setAnimate(true)

        // Reset animation class after it plays
        setTimeout(() => setAnimate(false), 300)

        if (onToggle) onToggle(newState)

        try {
            setIsLoading(true)
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vehicleId })
            })

            if (response.status === 401) {
                // Si no estÃ¡ autorizado, redirigir a login
                // Revertir estado
                setIsFavorited(!newState)
                router.push('/auth')
                return
            }

            if (!response.ok) {
                throw new Error('Error al actualizar favorito')
            }

            // Confirmar estado real del servidor (opcional, por ahora confiamos en optimistic)
            // const data = await response.json()
            // setIsFavorited(data.isFavorited)

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
                rounded-full flex items-center justify-center transition-all duration-200
                ${isFavorited
                    ? 'bg-white text-primary-700 shadow-md'
                    : 'bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm'
                }
                ${animate ? 'animate-like-burst' : ''}
                ${sizeClasses[size]}
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
        </button>
    )
}

