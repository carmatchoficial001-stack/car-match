
import { NextResponse } from 'next/server';
import { interpretSearchQuery } from '@/lib/ai/searchInterpreter';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query, context } = body; // context: 'MARKET' or 'MAP'

        if (!query) {
            return NextResponse.json({ filters: {} });
        }

        const filters = await interpretSearchQuery(query, context || 'MARKET');

        return NextResponse.json({ filters });
    } catch (error) {
        console.error("API Search Error:", error);
        return NextResponse.json({ filters: {} }, { status: 500 });
    }
}
