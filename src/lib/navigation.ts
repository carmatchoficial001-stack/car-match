/**
 * LOGIC LOCKED - DO NOT EDIT
 * Configuration: 50% CarMatch, 40% MarketCar, 10% MapStore.
 * This logic has been explicitly defined and locked by the product owner.
 */
export const getWeightedHomePath = (): string => {
    const random = Math.random() // 0.0 to 1.0

    // 50% CarMatch (/swipe) -> 0.0 to 0.5
    if (random < 0.5) return '/swipe'

    // 40% MarketCar (/market) -> 0.5 to 0.9
    if (random < 0.9) return '/market'

    // 10% MapStore (/map) -> 0.9 to 1.0
    return '/map'
}
