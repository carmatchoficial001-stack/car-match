'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, AlertCircle, Film, Download, Zap, Loader2, RefreshCw } from 'lucide-react'
import { useVideoStitcher } from '@/hooks/useVideoStitcher'

interface SceneClip {
    sceneId: number
    predictionId: string | null
    status: string
    url: string | null
}

interface Props {
    scenes: SceneClip[]
    onRetryScene?: (sceneId: number) => void
}

function SceneStatusIcon({ status }: { status: string }) {
    if (status === 'succeeded') return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
    if (status === 'failed' || status === 'error') return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
    if (status === 'processing' || status === 'starting') return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
    return <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
}

function SceneStatusLabel({ status }: { status: string }) {
    if (status === 'succeeded') return <span className="text-green-400">Listo</span>
    if (status === 'failed' || status === 'error') return <span className="text-red-400">Error</span>
    if (status === 'processing') return <span className="text-yellow-400">Procesando...</span>
    if (status === 'starting') return <span className="text-blue-400">Iniciando...</span>
    return <span className="text-zinc-500">En cola...</span>
}

export default function MultiSceneVideoPlayer({ scenes, onRetryScene }: Props) {
    const downloadRef = useRef<HTMLAnchorElement>(null)
    const { status, progress, finalVideoUrl, error, stitch, reset } = useVideoStitcher()

    const completedClips = scenes.filter(s => s.status === 'succeeded' && s.url)
    const totalScenes = scenes.length
    const allReady = completedClips.length === totalScenes && totalScenes > 0
    const totalDuration = scenes.length * 8 // aprox 8s por escena

    const handleStitch = async () => {
        const clips = completedClips.map(s => ({ sceneId: s.sceneId, url: s.url! }))
        await stitch(clips)
    }

    const handleDownload = () => {
        if (!finalVideoUrl || !downloadRef.current) return
        downloadRef.current.href = finalVideoUrl
        downloadRef.current.download = `carmatch-video-${Date.now()}.mp4`
        downloadRef.current.click()
    }

    return (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">
                        Video Multi-Escena
                    </span>
                    <span className="text-xs text-zinc-500">
                        ~{totalDuration}s final
                    </span>
                </div>
                <span className="text-xs font-bold text-purple-400">
                    {completedClips.length}/{totalScenes} clips
                </span>
            </div>

            {/* Progress bar global */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedClips.length / Math.max(totalScenes, 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Scene grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {scenes.map(scene => (
                    <div
                        key={scene.sceneId}
                        className={`
                            flex items-center gap-2 rounded-xl p-2.5 border text-xs
                            ${scene.status === 'succeeded'
                                ? 'border-green-500/20 bg-green-500/5'
                                : scene.status === 'failed' || scene.status === 'error'
                                    ? 'border-red-500/20 bg-red-500/5'
                                    : 'border-white/5 bg-zinc-900'}
                        `}
                    >
                        <SceneStatusIcon status={scene.status} />
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold truncate leading-tight">Escena {scene.sceneId}</div>
                            <SceneStatusLabel status={scene.status} />
                        </div>

                        {(scene.status === 'error' || scene.status === 'failed') && onRetryScene && (
                            <button
                                onClick={() => onRetryScene(scene.sceneId)}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                                title="Reintentar escena"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* FFmpeg Stitching Section */}
            {status === 'idle' && allReady && (
                <motion.button
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleStitch}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-sm py-3 rounded-xl transition-all"
                >
                    <Zap className="w-4 h-4" />
                    Ensamblar Video Final
                </motion.button>
            )}

            {(status === 'loading-ffmpeg' || status === 'downloading' || status === 'stitching') && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {status === 'loading-ffmpeg' && 'Cargando editor de video...'}
                            {status === 'downloading' && 'Descargando clips...'}
                            {status === 'stitching' && 'Ensamblando video...'}
                        </span>
                        <span className="font-bold text-purple-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 rounded-full"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}

            {status === 'done' && finalVideoUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <video
                        src={finalVideoUrl}
                        controls
                        className="w-full rounded-xl max-h-56 object-contain bg-black"
                    />
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black text-sm py-3 rounded-xl transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Descargar Video Final (.mp4)
                    </button>
                    <a ref={downloadRef} className="hidden" />
                </motion.div>
            )}

            {status === 'error' && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    ⚠️ {error || 'Error al ensamblar el video. Intenta de nuevo.'}
                    <button onClick={reset} className="ml-2 underline">Reintentar</button>
                </div>
            )}

            {!allReady && status === 'idle' && (
                <p className="text-xs text-zinc-500 text-center">
                    Esperando que todos los clips terminen de generarse...
                </p>
            )}
        </div>
    )
}
