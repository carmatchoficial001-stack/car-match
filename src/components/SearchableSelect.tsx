// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

"use client"

import { useState, useRef, useEffect } from 'react'

interface SearchableSelectProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    required?: boolean
    className?: string
    strict?: boolean
    renderOption?: (option: string) => React.ReactNode
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Selecciona...",
    label,
    required,
    className = "",
    strict = false,
    renderOption
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState(value)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sincronizar searchTerm con el valor externo (ej. autollenado IA)
    useEffect(() => {
        setSearchTerm(value)
    }, [value])

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Mostrar siempre lo que el usuario está escribiendo como "Opción personalizada" si no está exacta en la lista
    const showCustomOption = !strict && searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase())

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (val: string) => {
        onChange(val)
        setSearchTerm(val)
        setIsOpen(false)
        setHighlightedIndex(-1)
    }

    const handleBlur = () => {
        // En modo estricto, si el valor no está en la lista al salir, revertir al valor anterior
        if (strict && searchTerm) {
            const match = options.find(opt => opt.toLowerCase() === searchTerm.toLowerCase())
            if (match) {
                handleSelect(match)
            } else {
                setSearchTerm(value)
            }
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setSearchTerm(val)

        if (strict) {
            const match = options.find(opt => opt.toLowerCase() === val.toLowerCase())
            if (match) {
                onChange(match)
            } else if (val === "") {
                onChange("")
            }
            // En modo estricto NO enviamos basura al componente padre mientras el usuario escribe
        } else {
            onChange(val)
        }

        if (!isOpen) setIsOpen(true)
        setHighlightedIndex(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
            setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length + (showCustomOption ? 0 : -1)))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (highlightedIndex >= 0) {
                if (showCustomOption && highlightedIndex === 0) {
                    handleSelect(searchTerm)
                } else {
                    const idx = showCustomOption ? highlightedIndex - 1 : highlightedIndex
                    if (filteredOptions[idx]) handleSelect(filteredOptions[idx])
                }
            } else {
                setIsOpen(false)
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-text-primary font-medium mb-2">
                    {label} {required && <span className="text-red-400">*</span>}
                </label>
            )}

            <div className="relative group">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(handleBlur, 200)} // Timeout para permitir clics en la lista
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:outline-none focus:border-primary-700 transition pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none group-focus-within:text-primary-400 transition-colors">
                    <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-40 mt-2 w-full bg-surface border border-surface-highlight rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-fade-in-down custom-scrollbar">
                    {showCustomOption && (
                        <button
                            onClick={() => handleSelect(searchTerm)}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${highlightedIndex === 0 ? 'bg-primary-700/20 text-primary-400' : 'text-text-primary hover:bg-surface-highlight'}`}
                        >
                            <div>
                                <p className="font-bold">Usar: "{searchTerm}"</p>
                                <p className="text-xs text-text-secondary">Opción personalizada</p>
                            </div>
                        </button>
                    )}

                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => {
                            const actualIdx = showCustomOption ? idx + 1 : idx
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-t border-surface-highlight/10 ${highlightedIndex === actualIdx ? 'bg-primary-700/20 text-primary-400' : 'text-text-primary hover:bg-surface-highlight'}`}
                                >
                                    {renderOption ? renderOption(opt) : opt}
                                </button>
                            )
                        })
                    ) : (
                        !showCustomOption && (
                            <div className="px-4 py-8 text-center text-text-secondary">
                                <p>No encontramos coincidencias</p>
                                <p className="text-xs">Sigue escribiendo para agregarlo</p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
