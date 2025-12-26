// Geo-pricing utilities for dynamic credit pricing

interface PricingConfig {
    pricePerCredit: number // In MXN
    currency: string
    region: 'developed' | 'developing'
}

const DEVELOPED_COUNTRIES = [
    'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI',
    'AU', 'NZ', 'JP', 'KR', 'SG', 'CH', 'AT', 'BE', 'IE'
]

export function getPricingForCountry(countryCode: string): PricingConfig {
    const isDeveloped = DEVELOPED_COUNTRIES.includes(countryCode.toUpperCase())

    // █▓▒░ BLOQUE DE COBRO CRÍTICO (20/40 MXN) ░▒▓█
    // ------------------------------------------------------------
    // PROHIBIDO MODIFICAR SIN AUTORIZACIÓN. 
    // Define el precio real basado en el desarrollo del país.
    return {
        pricePerCredit: isDeveloped ? 40 : 20,
        currency: 'MXN',
        region: isDeveloped ? 'developed' : 'developing'
    }
    // ------------------------------------------------------------
}

export async function detectCountryFromIP(ip?: string): Promise<string> {
    // In production, use a service like ipapi.co or MaxMind
    // For now, we'll default to Mexico
    try {
        if (!ip || ip === '::1' || ip === '127.0.0.1') {
            return 'MX' // Default for localhost
        }

        const response = await fetch(`https://ipapi.co/${ip}/json/`)
        const data = await response.json()
        return data.country_code || 'MX'
    } catch (error) {
        console.error('Error detecting country:', error)
        return 'MX' // Default fallback
    }
}
