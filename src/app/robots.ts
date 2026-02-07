import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/messages/', '/settings/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/admin/', '/api/', '/messages/', '/settings/'],
                crawlDelay: 0
            },
            {
                userAgent: 'Bingbot',
                allow: '/',
                disallow: ['/admin/', '/api/', '/messages/', '/settings/'],
            }
        ],
        sitemap: 'https://carmatchapp.net/sitemap.xml',
        host: 'https://carmatchapp.net'
    }
}
