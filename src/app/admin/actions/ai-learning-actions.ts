'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { geminiFlashConversational } from '@/lib/ai/geminiModels'

// --- PERSONAL LEARNING (User DNA) ---

/**
 * Updates the user's personal DNA based on their interactions.
 */
export async function updateUserDNA(userId: string, interaction: string) {
    try {
        const dna = await prisma.userDNA.findUnique({
            where: { userId }
        })

        // Extract insights from text using Gemini Flash (Cheap & Fast)
        const prompt = `
            Analyze this user interaction in a car marketplace: "${interaction}"
            
            Current DNA: ${JSON.stringify(dna)}
            
            Update recommendation (JSON):
            {
                "brand": "string (brand name mentioned)",
                "type": "string (vehicle type)",
                "interests": "string (one keyword like 'off-road', 'economy', 'speed')",
                "budget": { "min": number, "max": number }
            }
            Only return the JSON.
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const insights = JSON.parse(text)

            await prisma.userDNA.upsert({
                where: { userId },
                create: {
                    userId,
                    preferredBrands: insights.brand ? [insights.brand] : [],
                    preferredTypes: insights.type ? [insights.type] : [],
                    interests: insights.interests ? [insights.interests] : [],
                    budgetRange: insights.budget || {},
                    searchHistory: [interaction]
                },
                update: {
                    preferredBrands: { push: insights.brand ? [insights.brand] : [] },
                    preferredTypes: { push: insights.type ? [insights.type] : [] },
                    interests: { push: insights.interests ? [insights.interests] : [] },
                    searchHistory: { push: [interaction] }
                }
            })
        } catch (e) {
            console.error('[AI-DNA] Parse error:', e)
        }
    } catch (error) {
        console.error('[AI-DNA] Update error:', error)
    }
}

// --- GLOBAL LEARNING (Global Insights) ---

/**
 * Tracks trends across all users.
 */
export async function trackGlobalTrend(type: string, key: string, value: string = "1") {
    try {
        await prisma.globalAIInsight.upsert({
            where: { key: `${type}_${key}` },
            create: {
                type,
                key: `${type}_${key}`,
                value,
                count: 1
            },
            update: {
                count: { increment: 1 }
            }
        })
    } catch (error) {
        console.error('[AI-GLOBAL] Track error:', error)
    }
}

/**
 * Gets top trends for prompt injection.
 */
export async function getTopTrends(type: string, limit: number = 5) {
    try {
        return await prisma.globalAIInsight.findMany({
            where: { type },
            orderBy: { count: 'desc' },
            take: limit
        })
    } catch (error) {
        return []
    }
}

// --- BRAND DNA (Admin/Publicity) ---

/**
 * Extracts marketing style from a chat session.
 */
export async function extractBrandInsights(sessionId: string) {
    try {
        const session = await prisma.aIStudioSession.findUnique({
            where: { id: sessionId },
            include: { messages: true }
        })

        if (!session) return

        const chatLog = session.messages.map(m => `${m.role}: ${m.content}`).join('\n')

        const prompt = `
            Analyze this marketing chat history and extract user style preferences.
            Chat:
            ${chatLog}
            
            Format JSON:
            {
                "tone": "casual/professional/aggressive",
                "targetAudience": "description",
                "preferredColors": ["color1", "color2"],
                "visualStyle": "realistic/artistic/minimalist"
            }
            Only return JSON.
        `

        const result = await geminiFlashConversational.generateContent(prompt)
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const insights = JSON.parse(text)

            await prisma.brandDNA.upsert({
                where: { userId: session.userId },
                create: {
                    userId: session.userId,
                    ...insights
                },
                update: insights
            })
        } catch (e) {
            console.error('[BRAND-DNA] Parse error:', e)
        }
    } catch (error) {
        console.error('[BRAND-DNA] Error:', error)
    }
}
