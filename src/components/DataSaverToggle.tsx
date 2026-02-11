// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

'use client'

import { useDataSaver } from '@/contexts/DataSaverContext'
import { Wifi, WifiOff } from 'lucide-react'

export default function DataSaverToggle() {
    const { ultraLiteMode, setUltraLiteMode } = useDataSaver()

    return (
        <div className="fixed bottom-20 right-6 z-40">
            <button
                onClick={() => setUltraLiteMode(!ultraLiteMode)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${ultraLiteMode
                        ? 'bg-green-600 text-white'
                        : 'bg-surface border border-surface-highlight text-text-primary'
                    }`}
                title={ultraLiteMode ? 'Modo Ultra Lite activado' : 'Activar Modo Ultra Lite'}
            >
                {ultraLiteMode ? (
                    <>
                        <WifiOff size={20} />
                        <span className="text-sm font-medium hidden sm:block">Sin Datos ✓</span>
                    </>
                ) : (
                    <>
                        <Wifi size={20} />
                        <span className="text-sm font-medium hidden sm:block">Ahorrar Datos</span>
                    </>
                )}
            </button>

            {ultraLiteMode && (
                <div className="mt-2 bg-green-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                    <p className="font-bold">🟢 Modo Sin Datos</p>
                    <p className="opacity-90">Solo texto, sin imágenes</p>
                    <p className="opacity-75 text-[10px] mt-1">~1 MB/sesión</p>
                </div>
            )}
        </div>
    )
}
