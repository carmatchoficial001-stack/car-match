import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/profile/', '/api/', '/messages/', '/login', '/register'],
        },
        sitemap: 'https://carmatch.mx/sitemap.xml', // Ajustar URL base si es necesario
    }
}
