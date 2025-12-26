import { NextResponse } from 'next/server'
import { updateTaxonomyDatabase } from '@/lib/ai/taxonomyUpdater'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const result = await updateTaxonomyDatabase()

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "Taxonomía actualizada correctamente",
            details: result
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
