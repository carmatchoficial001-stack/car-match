import { useLanguage } from '@/contexts/LanguageContext'
import { Car, Bike, Truck, Tractor, Bus, Star } from 'lucide-react'

interface VehicleCategory {
    id: string
    icon: any // Usaremos componentes de Lucide
    subtypes: string[]
}

const VEHICLE_CATEGORIES_DATA: VehicleCategory[] = [
    {
        id: 'automovil',
        icon: Car,
        subtypes: ['Sedán', 'SUV', 'Hatchback', 'Coupé', 'Convertible', 'Camioneta', 'Station Wagon', 'Crossover']
    },
    {
        id: 'motocicleta',
        icon: Bike,
        subtypes: ['Deportiva', 'Touring', 'Cruiser', 'Scooter', 'Off-Road', 'Motoneta', 'Naked', 'Trimoto', 'ATV/Cuatrimoto', 'UTV/Side-by-Side']
    },
    {
        id: 'comercial',
        icon: Truck,
        subtypes: ['Pickup', 'Van de carga', 'Camión ligero', 'Camión pesado', 'Panel', 'Chasis cabina', 'Volteo', 'Refrigerado', 'Tráiler']
    },
    {
        id: 'industrial',
        icon: Tractor,
        subtypes: ['Tractor', 'Montacargas', 'Excavadora', 'Grúa', 'Retroexcavadora', 'Maquinaria pesada', 'Cargador frontal', 'Bulldozer', 'Compactadora', 'Plataforma elevadora']
    },
    {
        id: 'transporte',
        icon: Bus,
        subtypes: ['Autobús', 'Microbús', 'Van de pasajeros', 'Combi', 'Minibús', 'Sprinter']
    },
    {
        id: 'especial',
        icon: Star,
        subtypes: ['Deportivo', 'Clásico', 'Modificado', 'Colección', 'Importado', 'Blindado', 'Conversión', 'Eléctrico', 'Híbrido especial']
    }
]

interface VehicleTypeSelectorProps {
    selectedCategory: string
    selectedSubtype: string
    onCategoryChange: (category: string) => void
    onSubtypeChange: (subtype: string) => void
}

export default function VehicleTypeSelector({
    selectedCategory,
    selectedSubtype,
    onCategoryChange,
    onSubtypeChange
}: VehicleTypeSelectorProps) {
    const { t } = useLanguage()
    const currentCategory = VEHICLE_CATEGORIES_DATA.find(c => c.id === selectedCategory)

    return (
        <div className="space-y-6">
            {/* Título */}
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">{t('publish.titles.what_type')}</h2>
                <p className="text-text-secondary">{t('publish.titles.select_category')}</p>
            </div>

            {/* Grid de Categorías */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {VEHICLE_CATEGORIES_DATA.map((category) => {
                    const isSelected = selectedCategory === category.id
                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                                onCategoryChange(category.id)
                                onSubtypeChange('') // Reset subtype
                            }}
                            className={`
                                p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center group
                                ${isSelected
                                    ? 'border-primary-700 bg-primary-700/10 shadow-lg shadow-primary-700/20'
                                    : 'border-surface-highlight bg-surface hover:border-primary-700/50 hover:bg-surface-highlight/50'
                                }
                            `}
                        >
                            <div className={`mb-3 transition-transform group-hover:scale-110 ${isSelected ? 'text-primary-400' : 'text-text-secondary'}`}>
                                <category.icon size={36} strokeWidth={1.5} />
                            </div>
                            <div className={`font-semibold text-sm ${isSelected ? 'text-primary-400' : 'text-text-primary'}`}>
                                {t(`publish.categories.${category.id}`)}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Subtypes */}
            {currentCategory && (
                <div className="pt-4 border-t border-surface-highlight">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                        {t('publish.titles.specific_type')} {t(`publish.categories.${currentCategory.id}`).toLowerCase()}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {currentCategory.subtypes.map((subtype) => {
                            const isSelected = selectedSubtype === subtype
                            return (
                                <button
                                    key={subtype}
                                    type="button"
                                    onClick={() => onSubtypeChange(subtype)}
                                    className={`
                                        px-4 py-3 rounded-lg border transition-all text-sm font-medium
                                        ${isSelected
                                            ? 'border-primary-700 bg-primary-700/10 text-primary-700'
                                            : 'border-surface-highlight bg-background text-text-primary hover:border-primary-700/50'
                                        }
                                    `}
                                >
                                    {subtype}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Validación */}
            {selectedCategory && !selectedSubtype && (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{t('publish.errors.select_specific')}</span>
                </div>
            )}
        </div>
    )
}

// Adapting the export to work with the changes. 
// Note: name property is removed from data, but we can fake it if needed by other components, 
// though ideally other components should also use i18n
const VEHICLE_CATEGORIES = VEHICLE_CATEGORIES_DATA.map(c => ({
    ...c,
    name: 'Translated in component'
}))

export { VEHICLE_CATEGORIES }
export type { VehicleCategory }



