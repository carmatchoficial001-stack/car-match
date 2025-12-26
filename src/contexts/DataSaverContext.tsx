'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DataSaverContextType {
    ultraLiteMode: boolean
    setUltraLiteMode: (value: boolean) => void
    dataUsedMB: number
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined)

export function DataSaverProvider({ children }: { children: ReactNode }) {
    const [ultraLiteMode, setUltraLiteMode] = useState(false)
    const [dataUsedMB, setDataUsedMB] = useState(0)

    useEffect(() => {
        // Detectar si el usuario tiene "Data Saver" activado en Chrome
        if ((navigator as any).connection?.saveData) {
            setUltraLiteMode(true)
            console.log('🟢 Modo Ultra Lite activado automáticamente')
        }

        // Cargar preferencia guardada
        const saved = localStorage.getItem('ultraLiteMode')
        if (saved === 'true') {
            setUltraLiteMode(true)
        }
    }, [])

    useEffect(() => {
        // Guardar preferencia
        localStorage.setItem('ultraLiteMode', ultraLiteMode.toString())
    }, [ultraLiteMode])

    return (
        <DataSaverContext.Provider value={{ ultraLiteMode, setUltraLiteMode, dataUsedMB }}>
            {children}
        </DataSaverContext.Provider>
    )
}

export function useDataSaver() {
    const context = useContext(DataSaverContext)
    if (!context) {
        throw new Error('useDataSaver must be used within DataSaverProvider')
    }
    return context
}
