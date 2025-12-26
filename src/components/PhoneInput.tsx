"use client"

import { useState, useEffect, useRef } from 'react'
import { COUNTRY_CODES, CountryCode } from '@/lib/countryCodes'

interface PhoneInputProps {
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    required?: boolean
    name?: string
    className?: string
}

export default function PhoneInput({
    value = '',
    onChange,
    placeholder = '123 456 7890',
    label,
    required = false,
    name,
    className
}: PhoneInputProps) {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]) // Default MX
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Parse initial value
    useEffect(() => {
        if (value) {
            // Try to find matching country code
            const country = COUNTRY_CODES.find(c => value.startsWith(c.dial_code))
            if (country) {
                setSelectedCountry(country)
                setPhoneNumber(value.replace(country.dial_code, '').trim())
            } else {
                // If clean number without code, assume current selection
                setPhoneNumber(value)
            }
        }
    }, [value])

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const val = e.target.value.replace(/\D/g, '')
        setPhoneNumber(val)

        // Return formatted full number to parent
        // If empty, return empty string
        if (val === '') {
            onChange('')
        } else {
            onChange(`${selectedCountry.dial_code} ${val}`)
        }
    }

    const handleCountrySelect = (country: CountryCode) => {
        setSelectedCountry(country)
        setIsOpen(false)

        // Update parent with new code + existing number
        if (phoneNumber) {
            onChange(`${country.dial_code} ${phoneNumber}`)
        }
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative flex gap-2">
                {/* Country Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-full px-3 py-3 bg-background border border-surface-highlight rounded-lg flex items-center gap-2 hover:bg-surface-highlight transition outline-none focus:border-primary-500"
                    >
                        {/* Flag Image */}
                        <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png 2x`}
                            width="28"
                            alt={selectedCountry.name}
                            className="rounded-sm object-cover"
                        />
                        <span className="text-sm font-bold text-text-primary hidden md:inline">{selectedCountry.dial_code}</span>
                        <svg className={`w-4 h-4 text-text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                            {COUNTRY_CODES.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition border-b border-gray-50 last:border-0"
                                >
                                    <img
                                        src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                        srcSet={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`}
                                        width="24"
                                        alt={country.name}
                                        className="rounded-sm object-cover"
                                    />
                                    <span className="text-sm font-bold w-12 text-gray-900">{country.dial_code}</span>
                                    <span className="text-sm text-gray-700 truncate font-medium">{country.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Number Input */}
                <div className="relative flex-1">
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handleNumberChange}
                        placeholder={placeholder}
                        name={name}
                        maxLength={selectedCountry.phoneLength || 15} // Dynamic limit based on country
                        // Anti-autocomplete hacks
                        autoComplete="off-phone-new"
                        data-lpignore="true"
                        data-form-type="other"
                        className="w-full px-4 py-3 bg-background border border-surface-highlight rounded-lg text-text-primary focus:border-primary-700 outline-none transition font-medium"
                    />
                </div>
            </div>
        </div>
    )
}
