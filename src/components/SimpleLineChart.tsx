// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { useMemo } from 'react'

interface SimpleLineChartProps {
    data: number[]
    color?: string
    height?: number
    label?: string
}

export default function SimpleLineChart({ data, color = '#3b82f6', height = 60, label }: SimpleLineChartProps) {
    const points = useMemo(() => {
        if (!data || data.length === 0) return ''
        const max = Math.max(...data)
        const min = Math.min(...data)
        const range = max - min || 1

        return data.map((val, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - ((val - min) / range) * 100
            return `${x},${y}`
        }).join(' ')
    }, [data])

    const fillPath = useMemo(() => {
        if (!points) return ''
        return `0,100 ${points} 100,100`
    }, [points])

    return (
        <div className="flex flex-col gap-2">
            {label && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>}
            <div className={`relative w-full overflow-hidden rounded-xl bg-${color.replace('#', '')}/5`} style={{ height }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {/* Gradient Fill */}
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <polygon points={fillPath} fill={`url(#gradient-${color})`} />
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    )
}
