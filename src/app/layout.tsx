import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";
import OpenInBrowserBanner from "@/components/OpenInBrowserBanner";
import { ResponsiveViewportFix } from "./responsive-viewport-fix";
import Header from "@/components/Header";
import RestoringSessionOverlay from "@/components/RestoringSessionOverlay";
import RestoreSessionModal from "@/components/RestoreSessionModal";
import InstallInvasiveBanner from "@/components/InstallInvasiveBanner";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://carmatchapp.net"),
    title: "CarMatch",
    description: "CarMatch es la red social líder para comprar, vender y descubrir vehículos en México. MarketCar oficial con Modo CarMatch y MapStore 24/7 de servicios automotrices.",
    alternates: {
        canonical: "https://carmatchapp.net",
        languages: {
            'es': 'https://carmatchapp.net',
            'en': 'https://carmatchapp.net/en',
            'ar': 'https://carmatchapp.net/ar',
            'de': 'https://carmatchapp.net/de',
            'fr': 'https://carmatchapp.net/fr',
            'hi': 'https://carmatchapp.net/hi',
            'it': 'https://carmatchapp.net/it',
            'ja': 'https://carmatchapp.net/ja',
            'ko': 'https://carmatchapp.net/ko',
            'pt': 'https://carmatchapp.net/pt',
            'ru': 'https://carmatchapp.net/ru',
            'zh': 'https://carmatchapp.net/zh',
            'x-default': 'https://carmatchapp.net',
        },
    },
    verification: {
        google: "u4BWC_7mrWziSal62PD0Jv6grcjI6Pl2zHOnc0Jcdxg",
    },
    keywords: ["CarMatch", "CarMatch App", "compra venta autos", "marketplace autos mexico", "talleres mecanicos 24 horas", "auxilio vial", "refacciones juarez"],
    manifest: "/manifest.webmanifest",
    authors: [{ name: "CarMatch" }],
    creator: "CarMatch",
    publisher: "CarMatch",
    openGraph: {
        type: "website",
        locale: "es_MX",
        url: "https://carmatchapp.net",
        siteName: "CarMatch",
        title: "CarMatch | La Revolución Automotriz",
        description: "Desliza, encuentra y conecta. La forma más inteligente y segura de comprar autos y encontrar servicios mecánicos.",
        images: [
            {
                url: "/icon-512-v19.png", // 🔥 FIX: Using dark-bg high-res icon for better preview
                width: 512,
                height: 512,
                alt: "CarMatch® | Marketplace Oficial",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CarMatch | El Marketplace de Autos del Futuro",
        description: "Compra, vende y encuentra servicios mecánicos en tiempo real. La app definitiva para el sector automotriz.",
        images: ["/icon-512-v19.png"], // 🔥 FIX: Dark-bg for Twitter
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CarMatch",
    },
    icons: {
        icon: [
            { url: "/icon-192-v19.png", sizes: "192x192" },
            { url: "/favicon-v19.png", sizes: "32x32" },
        ],
        shortcut: "/icon-192-v19.png",
        apple: "/icon-192-v19.png",
        other: [
            {
                rel: 'maskable-icon',
                url: '/maskable-192-v19.png',
            },
        ],
    }
};

export const viewport: Viewport = {
    themeColor: "#0f172a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    colorScheme: "dark",
};

import PushNotificationRequest from "@/components/PushNotificationRequest";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
            <body className={`${inter.className} min-h-screen-safe overflow-x-hidden bg-[#0f172a]`}>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify([
                            {
                                "@context": "https://schema.org",
                                "@type": "Organization",
                                "name": "CarMatch®",
                                "alternateName": "CarMatch Official",
                                "url": "https://carmatchapp.net",
                                "logo": "https://carmatchapp.net/icon-512-v19.png", // 🔥 FIX: Dark background for search engines
                                "sameAs": [
                                    "https://www.facebook.com/share/1AVsMtGGrG/",
                                    "https://www.instagram.com/car.matchoficial?igsh=MWR2cjN5bGVmZzdoeQ=="
                                ],
                                "description": "CarMatch es la plataforma líder en México para la compra y venta de piezas y vehículos, conectando usuarios con servicios automotrices 24/7."
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "WebSite",
                                "url": "https://carmatchapp.net",
                                "potentialAction": [
                                    {
                                        "@type": "SearchAction",
                                        "target": {
                                            "@type": "EntryPoint",
                                            "urlTemplate": "https://carmatchapp.net/market?search={search_term_string}"
                                        },
                                        "query-input": "required name=search_term_string"
                                    },
                                    {
                                        "@type": "SearchAction",
                                        "target": {
                                            "@type": "EntryPoint",
                                            "urlTemplate": "https://carmatchapp.net/map-store?search={search_term_string}"
                                        },
                                        "query-input": "required name=search_term_string"
                                    }
                                ]
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "SoftwareApplication",
                                "name": "CarMatch",
                                "alternateName": "CarMatch App",
                                "url": "https://carmatchapp.net",
                                "applicationCategory": "ShoppingApplication, SocialNetworkingApplication",
                                "operatingSystem": "iOS, Android, Windows, macOS",
                                "description": "La aplicación líder para comprar, vender y descubrir vehículos. Incluye Buscadores Expertos para vehículos y detección de fallas mecánicas.",
                                "softwareVersion": "1.0.0",
                                "screenshot": "https://carmatchapp.net/icon-512-v19.png",
                                "offers": {
                                    "@type": "Offer",
                                    "price": "0",
                                    "priceCurrency": "USD"
                                },
                                "aggregateRating": {
                                    "@type": "AggregateRating",
                                    "ratingValue": "4.9",
                                    "ratingCount": "1250"
                                }
                            }
                        ])
                    }}
                />
                <Providers>
                    <InstallInvasiveBanner />
                    <PushNotificationRequest />
                    <OpenInBrowserBanner />
                    <ResponsiveViewportFix />
                    <RestoringSessionOverlay />
                    <RestoreSessionModal />

                    {/* App Shell Architecture: Fixed Viewport + Internal Scroll */}
                    <div className="flex flex-col h-[100dvh] w-full overflow-hidden relative">
                        <Header />

                        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[80px] md:pb-0 scroll-smooth overscroll-behavior-y-contain">
                            {children}
                        </main>

                        <MobileNav />
                    </div>
                </Providers>
            </body>
        </html>
    );
}
