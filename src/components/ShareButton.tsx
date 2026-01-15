import { useState } from 'react'
import { Share2, Link as LinkIcon, Check } from 'lucide-react'

interface ShareButtonProps {
    title: string
    text: string
    url: string
    variant?: 'full' | 'minimal' | 'icon'
    className?: string
    children?: React.ReactNode
}

export default function ShareButton({ title, text, url, variant = 'full', className = '', children }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    const handleShare = async (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()

        // ✅ NUEVA ESTRATEGIA: Siempre copiar el link
        // Esto evita que se abra en WebViews de WhatsApp/FB/Telegram
        // El usuario puede pegar el link en su navegador real
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setShowTooltip(true)
            setTimeout(() => {
                setCopied(false)
                setShowTooltip(false)
            }, 3000)
        } catch (err) {
            console.error('Failed to copy', err)
            // Si falla copiar, intentar abrir en nueva pestaña
            window.open(url, '_blank')
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
                {/* Tooltip con instrucciones */}
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap z-50 shadow-xl">
                        ✅ Link copiado • Pégalo en tu navegador
                    </div>
                )}
            </div>
        )
    }

    if (variant === 'icon') {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={handleShare}
                    className="w-full h-full"
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Compartir"
                >
                    {copied ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                            <Check size={20} className="text-green-500" />
                            <span className="text-[10px] font-bold uppercase">Copiado</span>
                        </div>
                    ) : (children || <Share2 size={20} />)}
                </button>
                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded whitespace-nowrap z-50 shadow-xl">
                        ✅ Link copiado • Pégalo en tu navegador
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={className}>
            <button
                onClick={handleShare}
                className="w-full bg-primary-700 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-900/20"
            >
                {copied ? <Check size={20} /> : <Share2 size={20} />}
                {copied ? 'Link Copiado' : 'Compartir'}
            </button>
        </div>
    )
}
