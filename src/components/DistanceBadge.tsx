// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { formatDistance } from '@/lib/geolocation'

interface DistanceBadgeProps {
    distance: number
    locationName?: string
    onClick?: () => void
    className?: string
}

/**
 * Badge que muestra la distancia al vehículo o el radio de búsqueda actual
 */
export default function DistanceBadge({ distance, locationName, onClick, className = '' }: DistanceBadgeProps) {
    const Component = onClick ? 'button' : 'div'

    return (
        <Component
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900/20 text-primary-400 rounded-lg text-xs font-bold transition hover:bg-primary-900/30 ${onClick ? 'cursor-pointer hover:scale-105 select-none' : ''} ${className}`}
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
            <span className="truncate max-w-[150px]">
                {locationName ? `${locationName} (${formatDistance(distance)})` : formatDistance(distance)}
            </span>
        </Component>
    )
}
