// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { detectCountryFromIP, getPricingForCountry } from '@/lib/pricing'

export async function GET(req: NextRequest) {
    try {
        // Get user's IP from request
        const forwarded = req.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || undefined

        // Detect country
        const countryCode = await detectCountryFromIP(ip)

        // Get pricing (Fixed in MXN)
        const pricing = getPricingForCountry(countryCode)

        // Fetch Exchange Rate (Optional enhancement)
        let exchangeRateData = null
        try {
            // Fetch rates based on user's likely currency (mapping country to currency)
            // For simplicity, we'll just fetch specific rates or a base
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/MXN', { next: { revalidate: 3600 } })
            if (res.ok) {
                const data = await res.json()
                exchangeRateData = data.rates
            }
        } catch (e) {
            console.error('Error fetching exchange rates:', e)
        }

        // Map country to currency (Basic mapping)
        const currencyMap: Record<string, string> = {
            'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'EU': 'EUR',
            'ES': 'EUR', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR',
            'MX': 'MXN', 'CO': 'COP', 'AR': 'ARS', 'CL': 'CLP'
        }

        const localCurrency = currencyMap[countryCode] || 'USD'
        const rate = exchangeRateData ? exchangeRateData[localCurrency] : null

        const localPriceEstimate = rate ? (pricing.pricePerCredit * rate) : null

        return NextResponse.json({
            countryCode,
            ...pricing, // pricePerCredit (MXN), currency (MXN), region
            localCurrency,
            localPriceEstimate,
            exchangeRate: rate
        })
    } catch (error) {
        console.error('Error getting pricing:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
