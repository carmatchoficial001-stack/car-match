import { useState, useEffect } from 'react'

interface Brand {
    id: string
    name: string
    category: string
    logoUrl?: string
}

interface Model {
    id: string
    name: string
    yearIntroduced?: number
    isElectric?: boolean
    isHybrid?: boolean
}

export function useBrands(category?: string) {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchBrands() {
            try {
                setLoading(true)
                const url = category
                    ? `/api/vehicles/brands?category=${encodeURIComponent(category)}`
                    : '/api/vehicles/brands'

                const res = await fetch(url)
                if (!res.ok) throw new Error('Failed to fetch brands')

                const data = await res.json()
                setBrands(data)
                setError(null)
            } catch (err: any) {
                console.error('Error fetching brands:', err)
                setError(err.message)
                setBrands([])
            } finally {
                setLoading(false)
            }
        }

        fetchBrands()
    }, [category])

    return { brands, loading, error }
}

export function useModels(brandIdOrName?: string) {
    const [models, setModels] = useState<Model[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!brandIdOrName) {
            setModels([])
            setLoading(false)
            return
        }

        async function fetchModels() {
            try {
                setLoading(true)

                // Detectar si es ID (cuid) o nombre
                const isId = brandIdOrName.startsWith('cl') || brandIdOrName.startsWith('cm')
                const param = isId ? 'brandId' : 'brandName'

                const res = await fetch(`/api/vehicles/models?${param}=${encodeURIComponent(brandIdOrName)}`)
                if (!res.ok) throw new Error('Failed to fetch models')

                const data = await res.json()
                setModels(data)
                setError(null)
            } catch (err: any) {
                console.error('Error fetching models:', err)
                setError(err.message)
                setModels([])
            } finally {
                setLoading(false)
            }
        }

        fetchModels()
    }, [brandIdOrName])

    return { models, loading, error }
}

// Helper: Obtener lista de nombres simples (para compatibilidad con código antiguo)
export function useBrandNames(category?: string): string[] {
    const { brands } = useBrands(category)
    return brands.map(b => b.name)
}

export function useModelNames(brandName?: string): string[] {
    const { models } = useModels(brandName)
    return models.map(m => m.name)
}
