// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'

// API gratuita para tipo de cambio en tiempo real
const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest/MXN'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const country = searchParams.get('country') || 'MX'

        // PRECIOS BASE EN PESOS MEXICANOS (FIJOS)
        const BASE_PRICE_MXN = 20.00      // Para emergentes (LATAM, Asia, África)
        const PREMIUM_PRICE_MXN = 40.00   // Para desarrollados (USA, Europa, Japón)

        // PISOS MÍNIMOS EN USD (NO BAJAR DE AQUÍ)
        const MIN_PRICE_EMERGING = 1.00   // Mínimo $1.00 USD
        const MIN_PRICE_PREMIUM = 2.00    // Mínimo $2.00 USD

        // Lista de países emergentes
        const emergingMarkets = [
            'CO', 'AR', 'PE', 'CL', 'EC', 'GT', 'CR', 'BR', 'MX', // LATAM
            'IN', 'CN', 'VN', 'TH', 'ID', 'PH', 'EG', 'NG'  // Asia/África
        ]

        let currency = 'USD'
        let price = MIN_PRICE_PREMIUM
        let tierName = 'premium'
        let priceInMXN = PREMIUM_PRICE_MXN

        if (country === 'MX') {
            // México: siempre en MXN
            currency = 'MXN'
            price = BASE_PRICE_MXN
            tierName = 'mexico'
            priceInMXN = BASE_PRICE_MXN
        } else {
            // Obtener tipo de cambio en tiempo real
            let usdToMxnRate = 16.50 // Fallback por si falla la API

            try {
                const response = await fetch(EXCHANGE_API, {
                    next: { revalidate: 3600 } // Cache por 1 hora
                })
                if (response.ok) {
                    const data = await response.json()
                    usdToMxnRate = 1 / data.rates.USD // MXN -> USD
                }
            } catch (error) {
                console.warn('Error fetching exchange rate, using fallback:', error)
            }

            // Calcular precio en USD
            if (emergingMarkets.includes(country)) {
                // Emergentes: $20 MXN convertido
                const calculatedPrice = BASE_PRICE_MXN / usdToMxnRate
                price = Math.max(calculatedPrice, MIN_PRICE_EMERGING)
                tierName = 'standard'
                priceInMXN = BASE_PRICE_MXN
            } else {
                // Desarrollados: $40 MXN convertido
                const calculatedPrice = PREMIUM_PRICE_MXN / usdToMxnRate
                price = Math.max(calculatedPrice, MIN_PRICE_PREMIUM)
                tierName = 'premium'
                priceInMXN = PREMIUM_PRICE_MXN
            }

            currency = 'USD'
            price = Math.round(price * 100) / 100 // 2 decimales
        }

        const packages = [
            {
                id: `pkg_${tierName}_monthly`,
                name: 'Crédito Mensual',
                credits: 1,
                price: price,
                currency: currency,
                priceInMXN: priceInMXN,
                discountPercent: 0
            }
        ]

        return NextResponse.json(packages)

    } catch (error) {
        console.error('Error al obtener paquetes:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
