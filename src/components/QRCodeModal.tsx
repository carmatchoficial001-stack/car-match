"use client"

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Download, Check } from 'lucide-react'

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false)
    const qrRef = useRef<HTMLDivElement>(null)

    // URL de la aplicación (usa variable de entorno o fallback)
    const appUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(appUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Error al copiar:', error)
        }
    }

    const handleDownloadQR = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        // Convertir SVG a canvas y luego a imagen
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        // Tamaño del QR (más grande para mejor calidad al imprimir)
        const size = 1000
        canvas.width = size
        canvas.height = size

        img.onload = () => {
            if (ctx) {
                // Fondo blanco
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, size, size)
                // Dibujar QR
                ctx.drawImage(img, 0, 0, size, size)

                // Descargar
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = 'carmatch-qr-code.png'
                        link.click()
                        URL.revokeObjectURL(url)
                    }
                })
            }
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
                onClick={onClose}
                onKeyDown={(e: any) => handleKeyDown(e)}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md px-4 animate-in zoom-in-95 duration-200">
                <div className="bg-surface border border-surface-highlight rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary-900/30 to-transparent p-6 border-b border-surface-highlight">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl transition text-text-secondary hover:text-text-primary"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black tracking-tight text-text-primary">
                            Compartir CarMatch
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Escanea este código QR para abrir la app
                        </p>
                    </div>

                    {/* QR Code */}
                    <div className="p-8 flex flex-col items-center">
                        <div
                            ref={qrRef}
                            className="bg-white p-6 rounded-2xl shadow-xl"
                        >
                            <QRCodeSVG
                                value={appUrl}
                                size={220}
                                level="H"
                                includeMargin={false}
                                fgColor="#000000"
                                bgColor="#FFFFFF"
                            />
                        </div>

                        {/* URL Display */}
                        <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider font-bold">
                                Enlace directo
                            </p>
                            <p className="text-sm text-primary-400 font-mono truncate">
                                {appUrl}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 w-full flex gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-text-primary transition flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-green-500" />
                                        <span>¡Copiado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copiar Link</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownloadQR}
                                className="flex-1 px-4 py-3 bg-primary-700 hover:bg-primary-600 rounded-xl font-bold text-sm text-text-primary transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Descargar QR</span>
                            </button>
                        </div>

                        {/* Helper Text */}
                        <p className="mt-4 text-xs text-text-secondary text-center leading-relaxed">
                            💡 Descarga el QR para imprimirlo o compartirlo en redes sociales
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
