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
    webpack: (config) => {
        // Fix for EISDIR error on Windows with Next.js 15.5
        config.resolve.symlinks = false
        return config
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
};


// Injected by Sentry
import { withSentryConfig } from "@sentry/nextjs";

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Sentry Webpack Plugin Options
silent: true,
    org: "carmatch",
        project: "javascript-nextjs",

            // Sentry Next.js Options
            // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
            tunnelRoute: "/monitoring",

                // Enables automatic instrumentation of Vercel Cron Monitors.
                automaticVercelMonitors: true,
});
