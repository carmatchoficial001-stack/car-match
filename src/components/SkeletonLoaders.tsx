export function SkeletonCard() {
    return (
        <div className="bg-surface rounded-xl border border-surface-highlight overflow-hidden shadow-lg">
            {/* Image skeleton */}
            <div className="aspect-video bg-surface-highlight animate-pulse" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-6 bg-surface-highlight rounded animate-pulse w-3/4" />

                {/* Subtitle */}
                <div className="h-4 bg-surface-highlight rounded animate-pulse w-1/2" />

                {/* Price */}
                <div className="h-5 bg-surface-highlight rounded animate-pulse w-2/5" />

                {/* Divider */}
                <div className="border-t border-surface-highlight my-3" />

                {/* Button */}
                <div className="h-10 bg-surface-highlight rounded animate-pulse w-full" />
            </div>
        </div>
    )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-surface p-4 rounded-xl border border-surface-highlight">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-surface-highlight rounded animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-surface-highlight rounded animate-pulse w-3/4" />
                            <div className="h-4 bg-surface-highlight rounded animate-pulse w-1/2" />
                            <div className="h-4 bg-surface-highlight rounded animate-pulse w-2/3" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonMap() {
    return (
        <div className="w-full h-[600px] bg-surface-highlight rounded-xl animate-pulse flex items-center justify-center">
            <div className="text-text-secondary">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <p className="text-sm">Cargando mapa...</p>
            </div>
        </div>
    )
}
