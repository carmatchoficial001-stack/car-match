// Geo-pricing utilities for dynamic credit pricing

interface PricingConfig {
    pricePerCredit: number // In MXN
    currency: string
    region: 'developed' | 'developing'
}

// Lista completa de países de alto ingreso según Banco Mundial, OCDE y FMI
// Estos países cobran $40 MXN por crédito
const DEVELOPED_COUNTRIES = [
    // América del Norte
    'US', 'CA',

    // Europa Occidental
    'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI',
    'CH', 'AT', 'BE', 'IE', 'PT', 'LU', 'IS', 'GR', 'CY', 'MT',

    // Europa Central y del Este (Alto Ingreso)
    'CZ', 'SI', 'EE', 'SK', 'LT', 'LV', 'PL', 'HU', 'HR',

    // Oceanía
    'AU', 'NZ',

    // Asia Oriental y Sudeste Asiático (Desarrollados)
    'JP', 'KR', 'SG', 'HK', 'TW', 'BN', 'MO',

    // Medio Oriente (Alto Ingreso)
    'AE', 'QA', 'SA', 'KW', 'BH', 'OM', 'IL',

    // Caribe y Territorios (Alto Ingreso)
    'BS', 'BB', 'TC', 'KY', 'BM', 'VI', 'PR',

    // Otros territorios de alto ingreso
    'GU', 'MP', 'AS', 'AW', 'CW', 'SX'
]

export function getPricingForCountry(countryCode: string): PricingConfig {
    const isDeveloped = DEVELOPED_COUNTRIES.includes(countryCode.toUpperCase())

    // █▓▒░ BLOQUE DE COBRO CRÍTICO (20/40 MXN) ░▒▓█
    // ------------------------------------------------------------
    // ⚠️ CRITICAL: DO NOT MODIFY. PRODUCTION SETTING.
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
