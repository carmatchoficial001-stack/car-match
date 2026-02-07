/* 
 * INSTRUCCIONES:
 * Reemplaza las líneas 281-299 en SwipeClient.tsx con este código:
 */

const expandSearch = useCallback(() => {
    if (isExpandingRef.current) return

    isExpandingRef.current = true

    // React 18 agrupa estas actualizaciones automáticamente
    setSeenIds(new Set())
    setTierIndex(prev => (prev + 1) % RADIUS_TIERS.length)
    setIsInternalLoading(true)

    // Resetear flags después del siguiente frame
    requestAnimationFrame(() => {
        setIsInternalLoading(false)
        isExpandingRef.current = false
    })
}, [])
