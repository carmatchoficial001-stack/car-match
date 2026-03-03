'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { checkAIAssetStatus, launchSingleImagePrediction } from '@/app/admin/actions/ai-content-actions'
import { updatePublicityCampaign, saveAIAssetUrl } from '@/app/admin/actions/publicity-actions'

// Convierte un Blob a data URI (base64)
function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

// Helper para subir imágenes de Pollinations a Cloudinary via nuestro proxy
// 🛡️ FIX: El servidor descarga la imagen via proxy (evita CORS y Cloudflare),
//          luego el browser convierte a base64 y sube a Cloudinary.
async function promoteToCdnIfNeeded(url: string | null): Promise<string | null> {
    if (!url) return null;
    // Si ya está en Cloudinary o es un stock fallback, no hacer nada
    if (url.includes('res.cloudinary.com') || url.includes('images.unsplash.com')) {
        return url;
    }

    try {
        console.log('[PROMOTION] Downloading via server proxy...', url)

        // 1. Descargar via proxy CORS del servidor (evita CORS y Cloudflare 530)
        const proxyUrl = `/api/ai/proxy-image?url=${encodeURIComponent(url)}`
        const imgRes = await fetch(proxyUrl)

        if (!imgRes.ok) {
            throw new Error(`Proxy HTTP ${imgRes.status}`)
        }

        const blob = await imgRes.blob()
        if (!blob.type.startsWith('image/') || blob.size < 1000) {
            throw new Error(`Respuesta inválida: ${blob.type}, ${blob.size} bytes`)
        }

        console.log(`[PROMOTION] ✅ Imagen obtenida via proxy: ${(blob.size / 1024).toFixed(1)}KB`)

        // 2. Convertir a data URI y enviar al servidor para subir a Cloudinary
        const imageBase64 = await blobToDataUri(blob)
        const res = await fetch('/api/ai/upload-pollinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64 })
        })
        const data = await res.json()
        if (data.success && data.cloudinaryUrl) {
            console.log('[PROMOTION] ✅ Cloudinary upload success:', data.cloudinaryUrl)
            return data.cloudinaryUrl
        }
        console.warn('[PROMOTION] Cloudinary upload failed, using fallback:', data.fallbackUrl || url)
        return data.fallbackUrl || url
    } catch (e) {
        console.error('[PROMOTION] Proxy flow failed, trying direct server upload:', e)
        // Fallback: enviar URL directa al servidor para que intente descargar y subir
        try {
            const res = await fetch('/api/ai/upload-pollinations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pollinationsUrl: url })
            })
            const data = await res.json()
            if (data.success && data.cloudinaryUrl) {
                return data.cloudinaryUrl
            }
            return data.fallbackUrl || url
        } catch {
            return url
        }
    }
}


export interface ImageClip {
    imageId: string // e.g. 'img_0', 'img_1', or 'square', 'vertical'
    prompt: string
    predictionId: string | null
    status: string // 'pending', 'starting', 'processing', 'promoting', 'succeeded', 'error', 'failed'
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
                                // Guardar en DB si terminó — pero NO mostrar URL cruda de Pollinations
                                if (updated.status === 'succeeded' && updated.url && clip.status !== 'succeeded') {
                                    // PROMOTE TO CLOUDINARY BEFORE SAVING (no mostrar URL raw)
                                    promoteToCdnIfNeeded(updated.url).then(finalUrl => {
                                        if (finalUrl) {
                                            saveAIAssetUrl(campaignId, clip.imageId, finalUrl)
                                            setProductions(latest => {
                                                const p = latest[campaignId]
                                                if (!p) return latest
                                                return {
                                                    ...latest,
                                                    [campaignId]: {
                                                        ...p,
                                                        clips: p.clips.map(c => c.imageId === clip.imageId ? { ...c, url: finalUrl, status: 'succeeded' } : c),
                                                        lastUpdate: Date.now()
                                                    }
                                                }
                                            })
                                        }
                                    })
                                    // Mientras se sube a CDN, mostrar 'promoting' (sin URL cruda)
                                    return { ...clip, status: 'promoting', url: null }
                                }
                                return { ...clip, status: updated.status, url: null }
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

            // Verificar si los anteriores terminaron (éxito o error) para que sea secuencial estricto
            const previousReady = nextIdx === 0 || prod.clips.slice(0, nextIdx).every(s => s.status === 'succeeded' || s.status === 'error' || s.status === 'failed')
            if (!previousReady) return

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
                    // Si ya viene con DONE|, extraemos la URL cruda de Pollinations
                    const isDone = res.predictionId.startsWith('DONE|')
                    const rawPollinationsUrl = isDone ? res.predictionId.split('DONE|')[1] : null

                    // 🛡️ ANTI-BLACK-IMAGE: Nunca ponemos la URL cruda de Pollinations como url.
                    // Mostramos 'promoting' (spinner) hasta tener la URL de Cloudinary.
                    setProductions(prev => {
                        const p = prev[campaignId]
                        if (!p) return prev
                        return {
                            ...prev,
                            [campaignId]: {
                                ...p,
                                clips: p.clips.map(c =>
                                    c.imageId === toLaunch.imageId
                                        ? { ...c, predictionId: res.predictionId!, status: isDone ? 'promoting' : 'processing', url: null }
                                        : c
                                ),
                                lastUpdate: Date.now()
                            }
                        }
                    })

                    // Si ya tenemos la URL, la subimos a Cloudinary y ENTONCES la mostramos
                    if (isDone && rawPollinationsUrl) {
                        promoteToCdnIfNeeded(rawPollinationsUrl).then(promotedUrl => {
                            const cdnUrl = promotedUrl || rawPollinationsUrl
                            saveAIAssetUrl(campaignId, toLaunch.imageId, cdnUrl)
                            setProductions(latest => {
                                const p = latest[campaignId]
                                if (!p) return latest
                                return {
                                    ...latest,
                                    [campaignId]: {
                                        ...p,
                                        clips: p.clips.map(c => c.imageId === toLaunch.imageId ? { ...c, url: cdnUrl, status: 'succeeded' } : c),
                                        lastUpdate: Date.now()
                                    }
                                }
                            })
                        })
                    }

                    // Actualizar BD con predictionId pendiente
                    const currentProd = productions[campaignId];
                    if (currentProd) {
                        const imagePendingIds: any = {}
                        currentProd.clips.forEach(c => {
                            if (c.imageId === toLaunch.imageId) imagePendingIds[c.imageId] = res.predictionId!
                            else if (c.predictionId) imagePendingIds[c.imageId] = c.predictionId
                            else imagePendingIds[c.imageId] = 'PENDING...'
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
