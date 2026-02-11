// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CreditBalance() {
    const [credits, setCredits] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch('/api/credits/balance')
                if (res.ok) {
                    const data = await res.json()
                    setCredits(data.credits)
                }
            } catch (error) {
                console.error('Error fetching credits:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()

        // Escuchar evento de actualización de créditos (para cuando se compra)
        const handleUpdate = () => fetchBalance()
        window.addEventListener('credits-updated', handleUpdate)

        return () => window.removeEventListener('credits-updated', handleUpdate)
    }, [])

    if (loading) return null

    return (
        <Link
            href="/credits"
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-highlight hover:bg-surface-highlight/80 rounded-full transition border border-surface-highlight group"
        >
            <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <span className="text-sm font-bold text-text-primary group-hover:text-primary-400 transition">
                {credits !== null ? credits : '-'}
            </span>
        </Link>
    )
}
