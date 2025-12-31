import React from 'react'
import Image from 'next/image'

interface LogoProps {
    className?: string
    showText?: boolean
    textClassName?: string
}

export function Logo({ className = "w-12 h-12", showText = false, textClassName = "text-2xl font-black tracking-tight" }: LogoProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <div className={`relative ${className}`}>
                <Image
                    src="/logo-v17.png"
                    alt="CarMatch Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {showText && (
                <span className={textClassName}>CarMatch</span>
            )}
        </div>
    )
}
