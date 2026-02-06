"use client"

import { useState, useEffect } from 'react'
import { Clock, Copy, Check, Info } from 'lucide-react'

interface DaySchedule {
    isOpen: boolean
    open: string
    close: string
}

export interface WeeklySchedule {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
}

interface OpeningHoursEditorProps {
    value: string
    onChange: (value: string) => void
}

const DEFAULT_DAY: DaySchedule = { isOpen: true, open: '09:00', close: '18:00' }
const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday: { ...DEFAULT_DAY },
    tuesday: { ...DEFAULT_DAY },
    wednesday: { ...DEFAULT_DAY },
    thursday: { ...DEFAULT_DAY },
    friday: { ...DEFAULT_DAY },
    saturday: { ...DEFAULT_DAY, close: '14:00' },
    sunday: { ...DEFAULT_DAY, isOpen: false },
}

const DAYS_TRANSLATION: Record<keyof WeeklySchedule, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
}

export default function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
    const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE)
    const [isJsonMode, setIsJsonMode] = useState(false)

    // Load initial value
    useEffect(() => {
        try {
            if (!value) return
            // Try to parse as JSON. If it fails, it's legacy text.
            const parsed = JSON.parse(value)
            // Validate basic structure to ensure it's our schema
            if (parsed.monday && typeof parsed.monday.isOpen === 'boolean') {
                setSchedule(parsed)
                setIsJsonMode(true)
            } else {
                // It's JSON but not our schema? Treat as text/legacy but keep default schedule in UI
                setIsJsonMode(false)
            }
        } catch (e) {
            // Not JSON, it's legacy text
            setIsJsonMode(false)
        }
    }, []) // Only run once on mount? Or when value changes externally? 
    // Ideally we track internal state and only emit up. If we depend on value, we might create loops if parent updates value reference.
    // For simplicity, we assume controlled component primarily via internal state -> onChange.

    const handleChange = (newSchedule: WeeklySchedule) => {
        setSchedule(newSchedule)
        onChange(JSON.stringify(newSchedule))
        setIsJsonMode(true) // Once touched, it becomes JSON
    }

    const updateDay = (day: keyof WeeklySchedule, field: keyof DaySchedule, val: any) => {
        const newSchedule = {
            ...schedule,
            [day]: {
                ...schedule[day],
                [field]: val
            }
        }
        handleChange(newSchedule)
    }

    const copyMondayToWeekdays = () => {
        const monday = schedule.monday
        const newSchedule = {
            ...schedule,
            tuesday: { ...monday },
            wednesday: { ...monday },
            thursday: { ...monday },
            friday: { ...monday }
        }
        handleChange(newSchedule)
    }

    const copyMondayToAll = () => {
        const monday = schedule.monday
        const newSchedule = {
            ...schedule,
            tuesday: { ...monday },
            wednesday: { ...monday },
            thursday: { ...monday },
            friday: { ...monday },
            saturday: { ...monday },
            sunday: { ...monday }
        }
        handleChange(newSchedule)
    }

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary-400" />
                    <span className="text-sm font-bold text-text-primary">Configurar Horario Semanal</span>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={copyMondayToWeekdays}
                        className="text-xs bg-surface-highlight hover:bg-surface-highlight/80 text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg transition border border-white/5 flex items-center gap-1"
                        title="Copiar Lunes a Martes-Viernes"
                    >
                        <Copy size={12} />
                        <span>Lunes a L-V</span>
                    </button>
                    <button
                        type="button"
                        onClick={copyMondayToAll}
                        className="text-xs bg-surface-highlight hover:bg-surface-highlight/80 text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg transition border border-white/5 flex items-center gap-1"
                        title="Copiar Lunes a toda la semana"
                    >
                        <Copy size={12} />
                        <span>Todo</span>
                    </button>
                </div>
            </div>

            {/* Warning if switching from Text to Structured */}
            {!isJsonMode && value && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                    <Info size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-text-secondary">
                        <p className="font-bold text-amber-400 mb-1">Formato de texto detectado</p>
                        <p>Actualmente tienes: <span className="text-white italic">"{value}"</span>.</p>
                        <p className="mt-1">Si modificas los controles de abajo, se sobrescribirá tu texto con el nuevo formato estructurado.</p>
                    </div>
                </div>
            )}

            {/* Grid of Days */}
            <div className="grid gap-2">
                {(Object.keys(DAYS_TRANSLATION) as Array<keyof WeeklySchedule>).map((day) => (
                    <div
                        key={day}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${schedule[day].isOpen
                                ? 'bg-surface-highlight/20 border-surface-highlight'
                                : 'bg-surface/50 border-transparent opacity-60'
                            }`}
                    >
                        {/* Toggle Checkbox */}
                        <div className="flex items-center h-full">
                            <input
                                type="checkbox"
                                id={`toggle-${day}`}
                                checked={schedule[day].isOpen}
                                onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-500 text-primary-600 focus:ring-primary-500 bg-transparent cursor-pointer"
                            />
                        </div>

                        {/* Label */}
                        <label
                            htmlFor={`toggle-${day}`}
                            className="w-24 text-sm font-medium text-text-primary cursor-pointer"
                        >
                            {DAYS_TRANSLATION[day]}
                        </label>

                        {/* Time Inputs */}
                        {schedule[day].isOpen ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="time"
                                    value={schedule[day].open}
                                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                                    className="bg-surface-highlight border-0 rounded-lg px-2 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary-500 w-24"
                                />
                                <span className="text-text-secondary text-xs">a</span>
                                <input
                                    type="time"
                                    value={schedule[day].close}
                                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                                    className="bg-surface-highlight border-0 rounded-lg px-2 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary-500 w-24"
                                />
                            </div>
                        ) : (
                            <div className="flex-1 text-sm text-text-secondary italic">
                                Cerrado
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
