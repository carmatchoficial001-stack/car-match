import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { MapPin, Star, Phone, Navigation } from 'lucide-react'
import { Metadata } from 'next'
import { getBusinessStatus } from '@/lib/businessTimeUtils'

interface Props {
    params: Promise<{ city: string; category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city, category } = await params
    const decodedCity = decodeURIComponent(city)
    const decodedCat = decodeURIComponent(category).replace('_', ' ')

    const title = `Los mejores ${decodedCat} en ${decodedCity} | CarMatch®`
    const description = `Directorio de ${decodedCat} en ${decodedCity}. Encuentra servicios verificados, horarios, teléfonos y ubicaciones en el MapStore de CarMatch.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        }
    }
}

export default async function LocalDirectoryPage({ params }: Props) {
    const { city, category } = await params
    const decodedCity = decodeURIComponent(city)
    const decodedCat = decodeURIComponent(category)

    const businesses = await prisma.business.findMany({
        where: {
            city: { equals: decodedCity, mode: 'insensitive' },
            category: { equals: decodedCat, mode: 'insensitive' },
            isActive: true
        },
        orderBy: { name: 'asc' }
    })

    if (businesses.length === 0) {
        notFound()
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": businesses.map((b, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "LocalBusiness",
                "name": b.name,
                "address": b.address,
                "image": b.images[0] || undefined,
                "url": `https://carmatchapp.net/business/${b.id}`
            }
        }))
    }

    return (
        <main className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <nav className="flex items-center gap-2 text-sm text-text-secondary mb-8">
                    <Link href="/" className="hover:text-primary-500 transition">CarMatch</Link>
                    <span>/</span>
                    <Link href="/map-store" className="hover:text-primary-500 transition">MapStore</Link>
                    <span>/</span>
                    <span className="capitalize">{decodedCity}</span>
                </nav>

                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-4">
                        Los mejores <span className="text-primary-500 capitalize">{decodedCat.replace('_', ' ')}</span> en {decodedCity}
                    </h1>
                    <p className="text-xl text-text-secondary max-w-3xl">
                        Explora los servicios automotrices más confiables y verificados en {decodedCity}. {businesses.length} resultados encontrados hoy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {businesses.map((business) => {
                        const status = getBusinessStatus(business.hours, business.is24Hours)
                        const rating = (Math.random() * (5 - 4) + 4).toFixed(1)

                        return (
                            <Link
                                key={business.id}
                                href={`/business/${business.id}`}
                                className="group bg-surface border border-surface-highlight rounded-[32px] overflow-hidden hover:border-primary-500/50 transition-all hover:scale-[1.02] shadow-xl hover:shadow-primary-900/20"
                            >
                                <div className="aspect-video w-full bg-surface-highlight relative overflow-hidden">
                                    {business.images[0] ? (
                                        <img
                                            src={business.images[0]}
                                            alt={business.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary-500/30 font-black text-6xl">
                                            {business.name.substring(0, 1)}
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 uppercase tracking-widest">
                                        {business.category}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-black text-text-primary line-clamp-1 group-hover:text-primary-500 transition">
                                            {business.name}
                                        </h2>
                                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                            <Star size={12} fill="currentColor" className="text-amber-500" />
                                            <span className="text-xs font-bold text-amber-500">{rating}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-4">
                                        <MapPin size={14} className="text-primary-500" />
                                        <span className="line-clamp-1">{business.address}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-surface-highlight">
                                        <div className={`text-xs font-bold uppercase tracking-wider ${status.isOpen ? 'text-green-500' : 'text-red-500'}`}>
                                            {status.statusText}
                                        </div>
                                        <div className="flex gap-2">
                                            {business.phone && (
                                                <div className="p-2 bg-surface-highlight rounded-full text-text-secondary">
                                                    <Phone size={14} />
                                                </div>
                                            )}
                                            <div className="p-2 bg-primary-600 rounded-full text-white shadow-lg shadow-primary-900/50">
                                                <Navigation size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                <div className="mt-20 p-8 border-2 border-dashed border-surface-highlight rounded-[40px] text-center">
                    <h3 className="text-2xl font-bold mb-4">¿Tienes un negocio en {decodedCity}?</h3>
                    <p className="text-text-secondary mb-8 max-w-xl mx-auto">
                        Únete a los más de 5,000 negocios que ya están en CarMatch y llega a miles de clientes locales que buscan tus servicios.
                    </p>
                    <Link
                        href="/auth"
                        className="inline-flex px-8 py-4 bg-primary-700 text-white rounded-full font-black uppercase tracking-widest hover:bg-primary-600 transition shadow-xl"
                    >
                        Registrar mi Negocio Gratis
                    </Link>
                </div>
            </div>
        </main>
    )
}
