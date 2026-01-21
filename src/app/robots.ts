import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/messages/', '/settings/'],
        },
        sitemap: 'https://carmatchapp.net/sitemap.xml',
    }
}
