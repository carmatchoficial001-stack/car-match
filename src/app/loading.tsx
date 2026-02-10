import Image from 'next/image'

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a]">
            <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6 animate-pulse">
                <Image
                    src="/icon-192-v20.png"
                    alt="CarMatch Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#f97316]">
                CarMatch
            </h1>
        </div>
    )
}
