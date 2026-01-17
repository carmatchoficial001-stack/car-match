import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";
import OpenInBrowserBanner from "@/components/OpenInBrowserBanner";
import { ResponsiveViewportFix } from "./responsive-viewport-fix";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: "CarMatch | Compra y Venta de Autos y Servicios Automotrices",
        template: "%s | CarMatch"
    },
    description: "Aplicación CarMatch: La red social líder para comprar autos, vender vehículos y encontrar talleres mecánicos 24/7 en Juárez y todo México. Tu app de emergencia y mercado automotriz.",
    keywords: ["CarMatch App", "servicio 24/7", "emergencia mecánica", "aplicación CarMatch", "venta de autos", "compra de autos", "talleres mecánicos", "refacciones Juárez", "auxilio vial"],
    manifest: "/manifest.json",
    authors: [{ name: "CarMatch Team" }],
    creator: "CarMatch",
    publisher: "CarMatch",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "es_MX",
        url: "https://carmatchapp.net",
        siteName: "CarMatch",
        title: "CarMatch | La Revolución Automotriz",
        description: "Desliza, encuentra y conecta. La forma más inteligente de comprar autos y encontrar servicios mecánicos.",
        images: [
            {
                url: "/logo-v18.png",
                width: 512,
                height: 512,
                alt: "CarMatch Logo",
            },
        ],
    },
    twitter: {
        card: "summary",
        title: "CarMatch | La Revolución Automotriz",
        description: "La app definitiva para dueños de vehículos. Compra, vende y encuentra talleres en tiempo real.",
        images: ["/logo-v18.png"],
        creator: "@CarMatch",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CarMatch",
    },
    icons: {
        icon: [
            { url: "/favicon-v18.png", sizes: "32x32", type: "image/png" },
            { url: "/icon-192-v18.png", sizes: "48x48", type: "image/png" }, // Favicon recomendado por Google
            { url: "/icon-192-v18.png", sizes: "96x96", type: "image/png" },
            { url: "/icon-192-v18.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512-v18.png", sizes: "512x512", type: "image/png" }
        ],
        apple: [
            { url: "/maskable-192-v18.png", sizes: "180x180", type: "image/png" }
        ],
        other: [
            { rel: 'apple-touch-icon', url: '/icon-192-v18.png' },
        ]
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
    interactiveWidget: "resizes-content",
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
                                "@type": "SoftwareApplication",
                                "name": "CarMatch",
                                "alternateName": "CarMatch App",
                                "url": "https://carmatchapp.net",
                                "applicationCategory": "ShoppingApplication, SocialNetworkingApplication",
                                "operatingSystem": "iOS, Android, Windows, macOS",
                                "description": "La aplicación líder para comprar, vender y descubrir vehículos. Incluye Swipe estilo Tinder y MapStore de talleres.",
                                "softwareVersion": "1.0.0",
                                "screenshot": "https://carmatchapp.net/logo-v18.png",
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
                            },
                            {
                                "@context": "https://schema.org",
                                "@type": "WebSite",
                                "url": "https://carmatchapp.net",
                                "potentialAction": {
                                    "@type": "SearchAction",
                                    "target": {
                                        "@type": "EntryPoint",
                                        "urlTemplate": "https://carmatchapp.net/market?q={search_term_string}"
                                    },
                                    "query-input": "required name=search_term_string"
                                }
                            }
                        ])
                    }}
                />
                <Providers>
                    <PushNotificationRequest />
                    <OpenInBrowserBanner />
                    <ResponsiveViewportFix />
                    <main className="min-h-screen-safe">
                        {children}
                    </main>
                    <MobileNav />
                </Providers>
            </body>
        </html>
    );
}
