import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { VEHICLE_CATEGORIES, BRANDS } from '@/lib/vehicleTaxonomy'

export const dynamic = 'force-dynamic' // Always fetch fresh data

export async function GET() {
    try {
        // 1. Fetch distinct Brands, Models, and Types from DB
        // We use groupBy to get unique combinations or just findMany with distinct if supported cleanly,
        // but explicit distinct is safer for just getting the values.

        // Fetch discovered knowledge from AI
        const discoveredBrands = await prisma.discoveredBrand.findMany()
        const discoveredTypes = await prisma.discoveredType.findMany()

        const dbBrands = await prisma.vehicle.findMany({
            select: { brand: true, vehicleType: true },
            distinct: ['brand', 'vehicleType'],
            where: { status: 'ACTIVE' } // Only active vehicles count
        })

        const dbModels = await prisma.vehicle.findMany({
            select: { model: true, brand: true },
            distinct: ['model', 'brand'],
            where: { status: 'ACTIVE' }
        })

        // 2. Consolidate Data

        const globalBrands = new Set<string>()
        const categoryBrands: Record<string, Set<string>> = {}
        const categoryTypes: Record<string, Set<string>> = {}

        // Initialize with static data
        Object.entries(BRANDS).forEach(([cat, list]) => {
            if (!categoryBrands[cat]) categoryBrands[cat] = new Set()
            list.forEach(b => {
                globalBrands.add(b)
                categoryBrands[cat].add(b)
            })
        })

        // Initialize Types with static data
        Object.entries(VEHICLE_CATEGORIES).forEach(([cat, subtypes]) => {
            if (!categoryTypes[cat]) categoryTypes[cat] = new Set()
            subtypes.forEach(t => categoryTypes[cat].add(t))
        })

        // Merge AI Discovered Brands
        discoveredBrands.forEach(b => {
            globalBrands.add(b.name)
            if (b.category && categoryBrands[b.category]) {
                categoryBrands[b.category].add(b.name)
            } else if (b.category) {
                // If category is new or mismatch, add to general? Or init category?
                if (!categoryBrands[b.category]) categoryBrands[b.category] = new Set()
                categoryBrands[b.category].add(b.name)
            }
        })

        // Merge AI Discovered Types
        discoveredTypes.forEach(t => {
            if (t.category) {
                if (!categoryTypes[t.category]) categoryTypes[t.category] = new Set()
                categoryTypes[t.category].add(t.name)
            }
        })


        // Helper to find category by subtype (checking both static and dynamic types)
        const findCategoryBySubtype = (subtype: string | null) => {
            if (!subtype) return null
            for (const [cat, subtypes] of Object.entries(categoryTypes)) { // Use the Set we are building
                if (subtypes.has(subtype)) return cat
            }
            // Fallback: Check static if not in dynamic yet (unlikely as we inited)
            return 'Automóvil'
        }

        // Merge DB Brands (from active vehicles)
        dbBrands.forEach(item => {
            if (item.brand) {
                globalBrands.add(item.brand)
                const cat = findCategoryBySubtype(item.vehicleType)
                if (cat) {
                    if (!categoryBrands[cat]) categoryBrands[cat] = new Set()
                    categoryBrands[cat].add(item.brand)
                }
            }
        })

        // Models 
        const allModels = Array.from(new Set(dbModels.map(m => m.model).filter(Boolean))) as string[]

        // Convert Sets to Arrays
        const consolidatedBrands: Record<string, string[]> = {}
        Object.keys(categoryBrands).forEach(cat => {
            consolidatedBrands[cat] = Array.from(categoryBrands[cat]).sort()
        })

        const consolidatedTypes: Record<string, string[]> = {}
        Object.keys(categoryTypes).forEach(cat => {
            consolidatedTypes[cat] = Array.from(categoryTypes[cat]).sort()
        })

        const allBrands = Array.from(globalBrands).sort()

        return NextResponse.json({
            brands: consolidatedBrands,
            types: consolidatedTypes,   // NEW: Dynamic Types
            allBrands: allBrands,
            models: allModels
        })

    } catch (error) {
        console.error('Error fetching taxonomy:', error)
        // Fallback to static if DB fails
        return NextResponse.json({
            brands: BRANDS,
            allBrands: [],
            models: []
        })
    }
}
