import { useState } from 'react'
import { Share2, Link as LinkIcon, Check } from 'lucide-react'

interface ShareButtonProps {
    title: string
    text: string
    url: string
    variant?: 'full' | 'minimal'
    className?: string
}

export default function ShareButton({ title, text, url, variant = 'full', className = '' }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    const handleShare = async (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()

        const shareData = {
            title: title,
            text: text,
            url: url,
        }

        // 1. Intentar API Nativa (Móviles: Abre menú de compartir de iOS/Android)
        if (navigator.share) {
            try {
                await navigator.share(shareData)
                return
            } catch (err) {
                // Si el usuario cancela o hay error, no hacemos nada (o podríamos hacer fallback)
                console.log('Error sharing:', err)
            }
        }

        // 2. Fallback Desktop: Copiar al portapapeles
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setShowTooltip(true)
            setTimeout(() => {
                setCopied(false)
                setShowTooltip(false)
            }, 2000)
        } catch (err) {
            // Fallback final: abrir WhatsApp si todo falla (solo si es variant full o lógica específica)
            // Pero "Copiar" es lo más genérico para "otros medios".
            console.error('Failed to copy', err)
        }
    }

    if (variant === 'minimal') {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={handleShare}
                    className="p-2 text-text-secondary hover:text-primary-400 transition rounded-full hover:bg-surface-highlight"
                    title="Compartir en..."
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                </button>
                {/* Tooltip simple */}
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
                        ¡Link copiado!
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex gap-2 mt-4">
            <button
                onClick={handleShare}
                className="flex-1 bg-primary-700 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-900/20"
            >
                <Share2 size={20} />
                Compartir
            </button>

            <button
                onClick={(e) => {
                    handleShare(e)
                }}
                className="bg-gray-800/50 hover:bg-gray-700/50 text-white p-3 rounded-xl border border-white/10 transition-colors backdrop-blur-sm"
                title="Copiar enlace"
            >
                {copied ? (
                    <Check size={20} className="text-green-500" />
                ) : (
                    <LinkIcon size={20} />
                )}
            </button>
        </div>
    )
}
