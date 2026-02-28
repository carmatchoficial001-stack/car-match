'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { checkAIAssetStatus, launchSingleImagePrediction } from '@/app/admin/actions/ai-content-actions'
import { updatePublicityCampaign, saveAIAssetUrl } from '@/app/admin/actions/publicity-actions'

export interface ImageClip {
    imageId: string // e.g. 'img_0', 'img_1', or 'square', 'vertical'
    prompt: string
    predictionId: string | null
    status: string // 'pending', 'starting', 'processing', 'succeeded', 'error', 'failed'
    url: string | null
}

interface ActiveImageProduction {
    campaignId: string
    clips: ImageClip[]
    lastUpdate: number
}

interface ImageProductionContextType {
    productions: Record<string, ActiveImageProduction>
    registerImageProduction: (campaignId: string, initialClips: ImageClip[]) => void
    retryImage: (campaignId: string, imageId: string) => void
    getClipsForImageCampaign: (campaignId: string) => ImageClip[]
}

const ImageProductionContext = createContext<ImageProductionContextType | undefined>(undefined)

export function ImageProductionProvider({ children }: { children: ReactNode }) {
    const [productions, setProductions] = useState<Record<string, ActiveImageProduction>>({})

    const registerImageProduction = (campaignId: string, initialClips: ImageClip[]) => {
        setProductions(prev => ({
            ...prev,
            [campaignId]: {
                campaignId,
                clips: initialClips,
                lastUpdate: Date.now()
            }
        }))
    }

    const retryImage = (campaignId: string, imageId: string) => {
        setProductions(prev => {
            const prod = prev[campaignId]
            if (!prod) return prev
            return {
                ...prev,
                [campaignId]: {
                    ...prod,
                    clips: prod.clips.map(c =>
                        c.imageId === imageId
                            ? { ...c, status: 'pending', predictionId: null, url: null }
                            : c
                    ),
                    lastUpdate: Date.now()
                }
            }
        })
    }

    const getClipsForImageCampaign = (campaignId: string) => {
        return productions[campaignId]?.clips || []
    }

    // A. POLLING: Revisa estados de Replicate
    useEffect(() => {
        const interval = setInterval(async () => {
            const activeIds = Object.keys(productions)
            if (activeIds.length === 0) return

            for (const campaignId of activeIds) {
                const prod = productions[campaignId]
                const pending = prod.clips.filter(s =>
                    s.predictionId &&
                    s.predictionId !== 'PENDING...' &&
                    s.status !== 'succeeded' &&
                    s.status !== 'failed' &&
                    s.status !== 'error'
                )

                if (pending.length > 0) {
                    const results = await Promise.all(pending.map(async p => {
                        const res = await checkAIAssetStatus(p.predictionId!)
                        return { imageId: p.imageId, ...res }
                    }))

                    setProductions(prev => {
                        const currentProd = prev[campaignId]
                        if (!currentProd) return prev

                        let updatedAny = false
                        const newClips = currentProd.clips.map(clip => {
                            const updated = results.find(r => r.imageId === clip.imageId)
                            if (updated && updated.status !== clip.status) {
                                updatedAny = true
                                // Guardar en DB si terminó
                                if (updated.status === 'succeeded' && updated.url && clip.status !== 'succeeded') {
                                    saveAIAssetUrl(campaignId, clip.imageId, updated.url)
                                }
                                return { ...clip, status: updated.status, url: updated.url || null }
                            }
                            return clip
                        })

                        if (updatedAny) {
                            return { ...prev, [campaignId]: { ...currentProd, clips: newClips, lastUpdate: Date.now() } }
                        }
                        return prev
                    })
                }
            }
        }, 6000)
        return () => clearInterval(interval)
    }, [productions])

    // B. SECUENCIMIENTO: Lanza la siguiente imagen si la anterior falló o terminó
    useEffect(() => {
        const activeIds = Object.keys(productions)
        if (activeIds.length === 0) return

        activeIds.forEach(async (campaignId) => {
            const prod = productions[campaignId]

            // Buscar siguiente a lanzar
            const nextIdx = prod.clips.findIndex(s => (!s.predictionId || s.predictionId === 'PENDING...') && s.status === 'pending')
            if (nextIdx === -1) return

            // Evitar lanzamientos duplicados
            if (prod.clips.some(s => s.status === 'starting')) return

            const toLaunch = prod.clips[nextIdx]

            // Marcar como starting localmente primero para bloquear otros efectos
            setProductions(prev => ({
                ...prev,
                [campaignId]: {
                    ...prev[campaignId],
                    clips: prev[campaignId].clips.map(c => c.imageId === toLaunch.imageId ? { ...c, status: 'starting' } : c)
                }
            }))

            try {
                const res = await launchSingleImagePrediction(toLaunch.prompt)

                if (res.success && res.predictionId) {
                    setProductions(prev => {
                        const p = prev[campaignId]
                        if (!p) return prev
                        return {
                            ...prev,
                            [campaignId]: {
                                ...p,
                                clips: p.clips.map(c =>
                                    c.imageId === toLaunch.imageId ? { ...c, predictionId: res.predictionId!, status: 'processing' } : c
                                ),
                                lastUpdate: Date.now()
                            }
                        }
                    })

                    // Actualizar BD con predictionId pendiente
                    const currentProd = productions[campaignId];
                    if (currentProd) {
                        const imagePendingIds: any = {}
                        currentProd.clips.forEach(c => {
                            if (c.imageId === toLaunch.imageId) imagePendingIds[c.imageId] = res.predictionId!
                            else if (c.predictionId && c.predictionId !== 'PENDING...') imagePendingIds[c.imageId] = c.predictionId
                        })

                        await updatePublicityCampaign(campaignId, { imagePendingIds })

                        // Notificar UI para refresco live modal
                        window.dispatchEvent(new CustomEvent('update-campaign-assets', {
                            detail: { imagePendingIds }
                        }));
                    }
                } else {
                    setProductions(prev => {
                        const p = prev[campaignId];
                        if (!p) return prev;
                        return {
                            ...prev,
                            [campaignId]: {
                                ...p,
                                clips: p.clips.map(c => c.imageId === toLaunch.imageId ? { ...c, status: 'error' } : c),
                                lastUpdate: Date.now()
                            }
                        }
                    })
                }
            } catch (error) {
                setProductions(prev => {
                    const p = prev[campaignId];
                    if (!p) return prev;
                    return {
                        ...prev,
                        [campaignId]: {
                            ...p,
                            clips: p.clips.map(c => c.imageId === toLaunch.imageId ? { ...c, status: 'error' } : c),
                            lastUpdate: Date.now()
                        }
                    }
                })
            }
        })
    }, [productions])

    return (
        <ImageProductionContext.Provider value={{ productions, registerImageProduction, retryImage, getClipsForImageCampaign }}>
            {children}
        </ImageProductionContext.Provider>
    )
}

export function useImageProduction() {
    const context = useContext(ImageProductionContext)
    if (context === undefined) {
        throw new Error('useImageProduction must be used within a ImageProductionProvider')
    }
    return context
}
