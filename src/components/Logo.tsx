import React from 'react'
import Image from 'next/image'

interface LogoProps {
    className?: string
    showText?: boolean
    textClassName?: string
}

export function Logo({ className = "w-12 h-12", showText = false, textClassName = "text-2xl font-black tracking-tight" }: LogoProps) {
    return (
        <div className="flex items-center gap-2">
            <div className={`relative ${className}`}>
                <Image
                    src="/logo-v18.png"
                    alt="CarMatch® | Marketplace Oficial de Autos y Servicios"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {showText && (
                <span className={`${textClassName} text-text-primary`}>CarMatch<span className="text-primary-500">®</span></span>
            )}
        </div>
    )
}
