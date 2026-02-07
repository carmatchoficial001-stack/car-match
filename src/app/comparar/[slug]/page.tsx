import { prisma } from "@/lib/db"
import { Metadata } from 'next'
import Header from "@/components/Header"
import { Check, X, ShieldCheck, Zap, Info } from 'lucide-react'
import Link from "next/link"

interface Props {
    params: Promise<{ slug: string }>
}

function parseVsSlug(slug: string) {
    const [partA, partB] = slug.split('-vs-')
    return {
        slugA: partA,
        slugB: partB
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const { slugA, slugB } = parseVsSlug(slug)
    const nameA = slugA.replace(/-/g, ' ').toUpperCase()
    const nameB = slugB.replace(/-/g, ' ').toUpperCase()

    const title = `✓ ${nameA} vs ${nameB}: ¿Cuál es mejor? Comparativa Técnica | CarMatch®`
    return {
        title,
        description: `Duelo de titanes: ${nameA} vs ${nameB}. Comparamos specs, motores, seguridad y precios para ayudarte a decidir tu próxima compra en CarMatch.`,
    }
}

export default async function ComparativePage({ params }: Props) {
    const { slug } = await params
    const { slugA, slugB } = parseVsSlug(slug)

    // Helper to find representative vehicle
    const findVehicle = async (term: string) => {
        const parts = term.split('-')
        const brand = parts[0]
        const model = parts.slice(1).join(' ')

        return await prisma.vehicle.findFirst({
            where: {
                brand: { contains: brand, mode: 'insensitive' },
                model: { contains: model, mode: 'insensitive' },
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    const [vehicleA, vehicleB] = await Promise.all([
        findVehicle(slugA),
        findVehicle(slugB)
    ])

    if (!vehicleA || !vehicleB) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Info size={48} className="text-primary-500" />
                <h1 className="text-2xl font-bold">Comparativa en proceso</h1>
                <p className="text-text-secondary">Estamos recopilando datos técnicos para este duelo. Por ahora te sugerimos ver nuestro catálogo general.</p>
                <Link href="/market" className="px-6 py-2 bg-primary-600 rounded-full font-bold">Ir al MarketCar</Link>
            </div>
        )
    }

    const specs = [
        { label: 'Motor', key: 'engine' },
        { label: 'Transmisión', key: 'transmission' },
        { label: 'Tracción', key: 'traction' },
        { label: 'Combustible', key: 'fuel' },
        { label: 'Pasajeros', key: 'passengers' },
        { label: 'Kilometraje', key: 'mileage' },
    ]

    return (
        <main className="min-h-screen bg-background">
            <Header />

            <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <span className="px-4 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-black uppercase tracking-widest border border-primary-500/20 mb-4 inline-block">Duelo de Titanes</span>
                    <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter mb-4">
                        {vehicleA.brand} <span className="text-primary-500">VS</span> {vehicleB.brand}
                    </h1>
                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Comparativa técnica detallada entre el {vehicleA.model} y el {vehicleB.model}. ¿Cuál merece un lugar en tu cochera?
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-12 relative">
                    {/* VS Badge logic */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full border-8 border-background text-2xl font-black italic shadow-2xl">
                        VS
                    </div>

                    {/* Left Car */}
                    <div className="space-y-6">
                        <div className="aspect-video rounded-3xl overflow-hidden bg-surface-highlight border border-white/5 relative group">
                            <img src={vehicleA.images[0]} alt={vehicleA.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                <h2 className="text-2xl font-black text-white">{vehicleA.brand} {vehicleA.model}</h2>
                                <p className="text-primary-400 font-bold">${vehicleA.price.toLocaleString()} {vehicleA.currency}</p>
                            </div>
                        </div>

                        <div className="bg-surface/50 border border-surface-highlight rounded-3xl p-6 space-y-4">
                            {specs.map(spec => (
                                <div key={spec.key} className="flex justify-between items-center py-3 border-b border-surface-highlight/50 last:border-0">
                                    <span className="text-xs font-bold text-gray-500 uppercase">{spec.label}</span>
                                    <span className="text-sm font-black text-text-primary">{(vehicleA as any)[spec.key] || 'N/A'}</span>
                                </div>
                            ))}
                        </div>

                        <Link href={`/comprar/${slugA}-${vehicleA.id}`} className="block w-full py-4 bg-white text-black text-center rounded-2xl font-black hover:bg-gray-200 transition">
                            VER DETALLES
                        </Link>
                    </div>

                    {/* Right Car */}
                    <div className="space-y-6">
                        <div className="aspect-video rounded-3xl overflow-hidden bg-surface-highlight border border-white/5 relative group">
                            <img src={vehicleB.images[0]} alt={vehicleB.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                <h2 className="text-2xl font-black text-white text-right">{vehicleB.brand} {vehicleB.model}</h2>
                                <p className="text-primary-400 font-bold text-right">${vehicleB.price.toLocaleString()} {vehicleB.currency}</p>
                            </div>
                        </div>

                        <div className="bg-surface/50 border border-surface-highlight rounded-3xl p-6 space-y-4">
                            {specs.map(spec => (
                                <div key={spec.key} className="flex justify-between items-center py-3 border-b border-surface-highlight/50 last:border-0">
                                    <span className="text-xs font-bold text-gray-500 uppercase">{spec.label}</span>
                                    <span className="text-sm font-black text-text-primary">{(vehicleB as any)[spec.key] || 'N/A'}</span>
                                </div>
                            ))}
                        </div>

                        <Link href={`/comprar/${slugB}-${vehicleB.id}`} className="block w-full py-4 bg-primary-600 text-white text-center rounded-2xl font-black hover:bg-primary-700 transition">
                            VER DETALLES
                        </Link>
                    </div>
                </div>

                {/* Verdict Section */}
                <div className="mt-20 p-8 md:p-12 bg-primary-900/10 border border-primary-500/20 rounded-[40px] text-center border-dashed">
                    <h3 className="text-3xl font-black mb-4">VEREDICTO CARMATCH®</h3>
                    <p className="text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
                        Ambos vehículos son líderes en su categoría. El <span className="text-text-primary font-bold">{vehicleA.brand} {vehicleA.model}</span> destaca por su valor de reventa, mientras que el <span className="text-text-primary font-bold">{vehicleB.brand} {vehicleB.model}</span> ofrece specs técnicos superiores en motorización. La decisión final depende de tu presupuesto y uso específico.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <div className="flex items-center gap-2 px-6 py-3 bg-background rounded-full border border-surface-highlight">
                            <ShieldCheck className="text-green-500" />
                            <span className="text-sm font-bold">Compra Protegida</span>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-3 bg-background rounded-full border border-surface-highlight">
                            <Zap className="text-amber-500" />
                            <span className="text-sm font-bold">Entrega Inmediata</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
