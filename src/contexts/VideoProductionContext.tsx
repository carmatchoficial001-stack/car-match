'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { checkMultiSceneStatus, saveSceneResult, launchSingleSceneVideoPrediction } from '@/app/admin/actions/ai-content-actions'

interface SceneClip {
    sceneId: number
    predictionId: string | null
    status: string
    url: string | null
}

interface ActiveProduction {
    campaignId: string
    master_style: string
    scenes: any[] // Guión original
    clips: SceneClip[] // Estado de los clips
    lastUpdate: number
}

interface VideoProductionContextType {
    productions: Record<string, ActiveProduction>
    registerProduction: (campaignId: string, strategy: any, initialClips: SceneClip[]) => void
    retryScene: (campaignId: string, sceneId: number) => void
    getClipsForCampaign: (campaignId: string) => SceneClip[]
}

const VideoProductionContext = createContext<VideoProductionContextType | undefined>(undefined)

export function VideoProductionProvider({ children }: { children: ReactNode }) {
    const [productions, setProductions] = useState<Record<string, ActiveProduction>>({})

    // 1. Registro de nuevas producciones (desde AI Studio)
    const registerProduction = (campaignId: string, strategy: any, initialClips: SceneClip[]) => {
        setProductions(prev => ({
            ...prev,
            [campaignId]: {
                campaignId,
                master_style: strategy.master_style,
                scenes: strategy.scenes || [],
                clips: initialClips,
                lastUpdate: Date.now()
            }
        }))
    }

    // 2. Reintento de escena
    const retryScene = (campaignId: string, sceneId: number) => {
        setProductions(prev => {
            const prod = prev[campaignId]
            if (!prod) return prev
            return {
                ...prev,
                [campaignId]: {
                    ...prod,
                    clips: prod.clips.map(c =>
                        c.sceneId === sceneId
                            ? { ...c, status: 'pending', predictionId: null, url: null }
                            : c
                    ),
                    lastUpdate: Date.now()
                }
            }
        })
    }

    const getClipsForCampaign = (campaignId: string) => {
        return productions[campaignId]?.clips || []
    }

    // --- BACKGROUND WORKER ---

    // A. POLLING: Revisa estados de Replicate
    useEffect(() => {
        const interval = setInterval(async () => {
            const activeIds = Object.keys(productions)
            if (activeIds.length === 0) return

            for (const campaignId of activeIds) {
                const prod = productions[campaignId]
                const pending = prod.clips.filter(s =>
                    s.predictionId &&
                    s.status !== 'succeeded' &&
                    s.status !== 'failed' &&
                    s.status !== 'error'
                )

                if (pending.length > 0) {
                    const res = await checkMultiSceneStatus(
                        pending.map(s => ({ sceneId: s.sceneId, predictionId: s.predictionId! }))
                    )

                    if (res.success && res.scenes) {
                        setProductions(prev => {
                            const currentProd = prev[campaignId]
                            if (!currentProd) return prev

                            const newClips = currentProd.clips.map(clip => {
                                const updated = res.scenes.find((r: any) => r.sceneId === clip.sceneId)
                                if (updated) {
                                    // Guardar en DB si terminó
                                    if (updated.status === 'succeeded' && updated.url && clip.status !== 'succeeded') {
                                        saveSceneResult(campaignId, clip.sceneId, updated.url)
                                    }
                                    return { ...clip, status: updated.status, url: updated.url }
                                }
                                return clip
                            })

                            return {
                                ...prev,
                                [campaignId]: { ...currentProd, clips: newClips, lastUpdate: Date.now() }
                            }
                        })
                    }
                }
            }
        }, 6000) // Polling cada 6s
        return () => clearInterval(interval)
    }, [productions])

    // B. SECUENCIMIENTO: Lanza el siguiente clip si el anterior falló o terminó
    useEffect(() => {
        const activeIds = Object.keys(productions)
        if (activeIds.length === 0) return

        activeIds.forEach(async (campaignId) => {
            const prod = productions[campaignId]

            // Buscar siguiente a lanzar
            const nextIdx = prod.clips.findIndex(s => !s.predictionId && s.status === 'pending')
            if (nextIdx === -1) return

            // Verificar si el anterior está listo
            const previousReady = nextIdx === 0 || prod.clips.slice(0, nextIdx).every(s => s.status === 'succeeded')
            if (!previousReady) return

            // Evitar lanzamientos duplicados
            if (prod.clips.some(s => s.status === 'starting')) return

            // Lanzar
            const toLaunch = prod.clips[nextIdx]

            // Marcar como starting localmente primero para bloquear otros efectos
            setProductions(prev => ({
                ...prev,
                [campaignId]: {
                    ...prev[campaignId],
                    clips: prev[campaignId].clips.map(c => c.sceneId === toLaunch.sceneId ? { ...c, status: 'starting' } : c)
                }
            }))

            const sceneData = prod.scenes.find((s: any) => (s.id || s.sceneId) === toLaunch.sceneId)
            const res = await launchSingleSceneVideoPrediction(
                { id: toLaunch.sceneId, visual_prompt: sceneData?.visual_prompt || '' },
                prod.master_style,
                campaignId
            )

            if (res.success && res.predictionId) {
                setProductions(prev => ({
                    ...prev,
                    [campaignId]: {
                        ...prev[campaignId],
                        clips: prev[campaignId].clips.map(c =>
                            c.sceneId === toLaunch.sceneId ? { ...c, predictionId: res.predictionId!, status: 'processing' } : c
                        ),
                        lastUpdate: Date.now()
                    }
                }))
            } else {
                setProductions(prev => ({
                    ...prev,
                    [campaignId]: {
                        ...prev[campaignId],
                        clips: prev[campaignId].clips.map(c => c.sceneId === toLaunch.sceneId ? { ...c, status: 'error' } : c),
                        lastUpdate: Date.now()
                    }
                }))
            }
        })
    }, [productions])

    return (
        <VideoProductionContext.Provider value={{ productions, registerProduction, retryScene, getClipsForCampaign }}>
            {children}
        </VideoProductionContext.Provider>
    )
}

export function useVideoProduction() {
    const context = useContext(VideoProductionContext)
    if (context === undefined) {
        throw new Error('useVideoProduction must be used within a VideoProductionProvider')
    }
    return context
}
