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
    },
};

export default nextConfig;
