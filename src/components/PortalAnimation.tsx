// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * 🌀 Portal Animation Component
 * Animación para auto-redirect cuando se detecta fraude
 */

interface PortalAnimationProps {
    show: boolean
}

export default function PortalAnimation({ show }: PortalAnimationProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 animate-in fade-in duration-500">
            <div className="text-center">
                {/* Icono giratorio */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-primary-600/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-7xl animate-spin">🌀</div>
                    </div>
                </div>

                {/* Mensaje */}
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-pulse">
                    Detectamos algo familiar...
                </h2>
                <p className="text-xl text-white/70 mb-2">
                    Te llevamos a tu publicación original
                </p>
                <p className="text-sm text-white/50">
                    ¡Ya habías publicado este vehículo! 😄
                </p>

                {/* Barra de progreso */}
                <div className="w-64 mx-auto mt-8 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 animate-progress-bar"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress-bar {
                    from {
                        width: 0%;
                    }
                    to {
                        width: 100%;
                    }
                }
                .animate-progress-bar {
                    animation: progress-bar 2s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
