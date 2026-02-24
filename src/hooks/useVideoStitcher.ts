'use client'

import { useState, useRef, useCallback } from 'react'

export type StitcherStatus = 'idle' | 'loading-ffmpeg' | 'downloading' | 'stitching' | 'done' | 'error'

export interface SceneClip {
    sceneId: number
    url: string
}

export function useVideoStitcher() {
    const [status, setStatus] = useState<StitcherStatus>('idle')
    const [progress, setProgress] = useState(0)
    const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const ffmpegRef = useRef<any>(null)

    const stitch = useCallback(async (clips: SceneClip[]) => {
        try {
            setStatus('loading-ffmpeg')
            setProgress(0)
            setError(null)
            setFinalVideoUrl(null)

            // Cargar FFmpeg WASM dinámicamente
            const { FFmpeg } = await import('@ffmpeg/ffmpeg')
            const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

            if (!ffmpegRef.current) {
                const ffmpeg = new FFmpeg()

                // Usar CDN para los binarios WASM (evita problemas de bundle size)
                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
                await ffmpeg.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                })

                ffmpeg.on('progress', ({ progress: p }: { progress: number }) => {
                    // El progreso de FFmpeg va de 0 a 1 durante el stitching
                    setProgress(Math.round(60 + p * 40)) // 60-100%
                })

                ffmpegRef.current = ffmpeg
            }

            const ffmpeg = ffmpegRef.current

            setStatus('downloading')
            setProgress(10)

            // Descargar todos los clips al filesystem virtual de FFmpeg
            const fileList: string[] = []
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i]
                const filename = `scene_${clip.sceneId}.mp4`
                const fileData = await fetchFile(clip.url)
                await ffmpeg.writeFile(filename, fileData)
                fileList.push(filename)
                setProgress(10 + Math.round((i + 1) / clips.length * 50)) // 10-60%
            }

            setStatus('stitching')

            // Crear archivo de lista para concatenación
            const concatContent = fileList.map(f => `file '${f}'`).join('\n')
            await ffmpeg.writeFile('filelist.txt', concatContent)

            // Concatenar todos los clips
            await ffmpeg.exec([
                '-f', 'concat',
                '-safe', '0',
                '-i', 'filelist.txt',
                '-c', 'copy',
                'output.mp4'
            ])

            // Leer el video final
            const outputData = await ffmpeg.readFile('output.mp4')
            const blob = new Blob([outputData], { type: 'video/mp4' })
            const url = URL.createObjectURL(blob)

            // Limpiar archivos del filesystem virtual
            for (const f of fileList) {
                await ffmpeg.deleteFile(f).catch(() => { })
            }
            await ffmpeg.deleteFile('filelist.txt').catch(() => { })
            await ffmpeg.deleteFile('output.mp4').catch(() => { })

            setFinalVideoUrl(url)
            setStatus('done')
            setProgress(100)

        } catch (e: any) {
            console.error('[VideoStitcher] Error:', e)
            setError(e.message || 'Error al ensamblar el video')
            setStatus('error')
        }
    }, [])

    const reset = useCallback(() => {
        setStatus('idle')
        setProgress(0)
        setError(null)
        if (finalVideoUrl) {
            URL.revokeObjectURL(finalVideoUrl)
            setFinalVideoUrl(null)
        }
    }, [finalVideoUrl])

    return { status, progress, finalVideoUrl, error, stitch, reset }
}
