'use client'

import { useDataSaver } from '@/contexts/DataSaverContext'
import { Car, MapPin, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/vehicleTaxonomy'

interface VehicleCardUltraLiteProps {
    vehicle: {
        id: string
        title: string
        price: number
        currency?: string | null
        city: string
        brand: string
        model: string
        year: number
    }
}

export default function VehicleCardUltraLite({ vehicle }: VehicleCardUltraLiteProps) {
    const { ultraLiteMode } = useDataSaver()

    if (!ultraLiteMode) return null

    return (
        <div className="bg-surface rounded-lg border border-surface-highlight p-4 hover:border-primary-700 transition">
            {/* Ícono de placeholder en lugar de imagen */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-surface-highlight rounded flex items-center justify-center flex-shrink-0">
                    <Car className="text-text-secondary" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary truncate">{vehicle.title}</h3>
                    <p className="text-sm text-text-secondary truncate">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                    </p>
                </div>
            </div>

            {/* Información compacta */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-700 font-bold text-lg">
                    {formatPrice(vehicle.price, vehicle.currency || 'MXN')}
                </div>

                <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <MapPin size={14} />
                    {vehicle.city}
                </div>
            </div>

            {/* Botón simple */}
            <button className="w-full mt-3 py-2 bg-primary-700 text-text-primary rounded-lg text-sm font-medium">
                Ver Detalles
            </button>
        </div>
    )
}
