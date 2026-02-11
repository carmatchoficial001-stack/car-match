// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SocialMediaManager } from '@/lib/social/SocialMediaManager'
import { suggestCampaignFromInventory } from '@/app/admin/actions/ai-content-actions'
import { generateSocialImage } from '@/lib/ai/dallE'

export async function GET(req: Request) {
    // 1. Security Check (Verify CRON_SECRET if present, or allow valid Vercel Cron header)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('⏰ [Cron] Iniciando Piloto Automático...');

        // 2. CHECK & PUBLISH APPROVED POSTS
        // Buscamos posts APROBADOS que aún no se han publicado
        const pendingPosts = await prisma.socialPost.findMany({
            where: { status: 'APPROVED', publishedAt: null },
            take: 1 // Publicamos 1 por ciclo para no saturar
        })

        if (pendingPosts.length > 0) {
            const post = pendingPosts[0]
            console.log(`🚀 Publicando post pendiente: ${post.id}`);

            const manager = SocialMediaManager.getInstance();

            // Publicar en las redes activas
            // Por defecto intentamos Facebook e Instagram si es imagen
            let results = []

            // Facebook
            const fbRes = await manager.postContent('FACEBOOK', post.content, post.imageUrl || undefined)
            results.push({ platform: 'FACEBOOK', ...fbRes })

            // Instagram (Solo si hay imagen)
            if (post.imageUrl) {
                const igRes = await manager.postContent('INSTAGRAM', post.content, post.imageUrl)
                results.push({ platform: 'INSTAGRAM', ...igRes })
            }

            // Marcar como PUBLICADO
            await prisma.socialPost.update({
                where: { id: post.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, action: 'PUBLISHED', results })
        }

        // 3. GENERATE NEW DRAFTS (If Queue is Low)
        // Si no hay nada aprobado, y hay pocos borradores (< 3), generamos uno nuevo.
        const draftCount = await prisma.socialPost.count({ where: { status: 'DRAFT' } })

        if (draftCount < 3) {
            console.log('✨ Generando nuevo borrador automático...');
            // Alternamos países o usamos el principal
            const res = await suggestCampaignFromInventory('MX');

            if (res.success && res.campaignData) {
                // Generate Image from Prompt
                const imagePrompt = res.campaignData.imagePrompt || `Luxury car in Mexico, ${res.campaignData.strategy}`;
                const imageRes = await generateSocialImage(imagePrompt);

                // Save Draft to DB
                const savedPost = await prisma.socialPost.create({
                    data: {
                        content: res.campaignData.caption || 'New Content',
                        imageUrl: (imageRes.success && imageRes.url) ? imageRes.url : null,
                        videoPrompt: res.campaignData.videoPrompt || res.campaignData.strategy,
                        platform: 'FACEBOOK', // Default
                        status: 'DRAFT',
                        aiPrompt: `Strategy: ${res.campaignData.strategy}`,
                        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h
                    }
                })

                console.log(`✅ Nuevo borrador guardado: ${savedPost.id}`);
                return NextResponse.json({ success: true, action: 'GENERATED_DRAFT', id: savedPost.id })
            }
        }

        return NextResponse.json({ success: true, action: 'IDLE', message: 'Nada que publicar, cola llena.' })

    } catch (error: any) {
        console.error('❌ Error en Cron:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
