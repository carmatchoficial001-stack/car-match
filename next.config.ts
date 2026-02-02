import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false, // Disable to fix Leaflet "Map container already initialized" error
    compress: true, // 🚀 Enable Gzip/Brotli compression
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
        // 💰 OPTIMIZACIÓN PARA 100M USUARIOS
        formats: ['image/webp', 'image/avif'], // 30-50% más ligero que JPEG
        deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Tamaños de dispositivos comunes
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Para iconos y thumbnails
        minimumCacheTTL: 2592000, // 30 días de caché (reduce bandwidth 60%)
        dangerouslyAllowSVG: false, // Seguridad: bloquear SVGs
        contentDispositionType: 'attachment', // Prevenir XSS
        unoptimized: false, // Siempre optimizar
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
};



export default nextConfig;
