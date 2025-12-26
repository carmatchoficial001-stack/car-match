"use client"

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface Suggestion {
    id: string
    place_name: string
    center: [number, number]
    context?: any[]
}

interface GlobalAddressSearchProps {
    onSelect: (data: {
        latitude: number
        longitude: number
        street: string
        streetNumber: string
        colony: string
        city: string
        state: string
        fullAddress: string
    }) => void
}

export default function GlobalAddressSearch({ onSelect }: GlobalAddressSearchProps) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const isSelection = useRef(false) // Flag to prevent re-searching on selection

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            // If the update was triggered by selecting an item, ignore it
            if (isSelection.current) {
                isSelection.current = false
                return
            }

            if (query.length > 2) {
                fetchSuggestions(query)
            } else {
                setSuggestions([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchSuggestions = async (searchText: string) => {
        setLoading(true)
        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            if (!token) return

            const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json`
            const params = new URLSearchParams({
                access_token: token,
                types: 'address,poi,place,locality',
                language: 'es',
                limit: '5'
            })

            const res = await fetch(`${endpoint}?${params.toString()}`)
            const data = await res.json()

            if (data.features) {
                setSuggestions(data.features)
                setIsOpen(true)
            }
        } catch (error) {
            console.error("Error fetching places:", error)
        } finally {
            setLoading(false)
        }
    }

    const parseContext = (feature: any) => {
        // Mapbox context is an array of parent objects (District, City, State, Country)
        let street = feature.text || ''
        let streetNumber = feature.address || ''
        let colony = ''
        let city = ''
        let state = ''

        // If specific address, text is street name, address is number. 
        // If POI, text is POI name.

        const context = feature.context || []

        context.forEach((item: any) => {
            const type = item.id.split('.')[0]
            if (type === 'neighborhood' || type === 'locality') {
                if (!colony) colony = item.text
            }
            if (type === 'place') {
                city = item.text
            }
            if (type === 'region') {
                state = item.text
            }
        })

        // Fallback for City/State if not found (sometimes encoded differently)
        if (!city && !colony && context.length > 0) {
            city = context[0].text // Often the first context is the city/district
        }

        return { street, streetNumber, colony, city, state }
    }

    const handleSelect = (feature: Suggestion) => {
        isSelection.current = true // Set flag to ignore next useEffect
        setQuery(feature.place_name)
        setIsOpen(false)

        const { street, streetNumber, colony, city, state } = parseContext(feature)
        const [lng, lat] = feature.center

        onSelect({
            latitude: lat,
            longitude: lng,
            street,
            streetNumber,
            colony,
            city,
            state,
            fullAddress: feature.place_name
        })
    }

    return (
        <div className="relative w-full z-20 pointer-events-auto" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    id="carmatch_location_search_v1"
                    name="carmatch_location_search_v1"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    placeholder="🔍 Buscar dirección o negocio (ej. Torre Eiffel, Av Reforma)"
                    className="w-full pl-12 pr-4 py-4 bg-surface border-2 border-primary-700/50 rounded-xl text-lg text-text-primary placeholder:text-text-secondary focus:border-primary-700 focus:ring-4 focus:ring-primary-700/20 outline-none transition shadow-lg"
                    autoComplete="new-password" // Hack: Chrome ignores 'off', but respects 'new-password' for non-password fields often.
                    list="autocompleteOff"
                    role="presentation"
                    data-lpignore="true"
                    spellCheck="false"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault()
                    }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500">
                    {loading ? <div className="animate-spin">⏳</div> : <Search size={24} />}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-surface rounded-xl shadow-2xl border border-surface-highlight max-h-[300px] overflow-y-auto">
                    {suggestions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-surface-highlight transition border-b border-surface-highlight last:border-0 flex items-start gap-3"
                        >
                            <span className="mt-1 text-lg">📍</span>
                            <div>
                                <p className="font-bold text-text-primary text-sm line-clamp-1">{item.text}</p>
                                <p className="text-xs text-text-secondary line-clamp-1">{item.place_name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Branding / Credit */}
            <div className="flex justify-end mt-1 px-2">
                <span className="text-[10px] text-text-secondary opacity-70">Powered by Mapbox 🚀</span>
            </div>
        </div>
    )
}
