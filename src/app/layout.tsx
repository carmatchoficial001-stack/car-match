import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import MobileNav from "@/components/MobileNav";
import OpenInBrowserBanner from "@/components/OpenInBrowserBanner";
import { ResponsiveViewportFix } from "./responsive-viewport-fix";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CarMatch",
    description: "Red social para compra, venta y descubrimiento de vehículos y negocios automotrices en tiempo real",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "CarMatch",
    },
    icons: {
        icon: [
            { url: "/favicon-v18.png", sizes: "32x32", type: "image/png" },
            { url: "/icon-192-v18.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512-v18.png", sizes: "512x512", type: "image/png" }
        ],
        apple: [
            { url: "/maskable-192-v18.png" }
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
            <body className={`${inter.className} min-h-screen-safe overflow-x-hidden bg-[#0f172a]`}>
                <Providers>
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
