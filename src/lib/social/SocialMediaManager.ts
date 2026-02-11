export class SocialMediaManager {
    private static instance: SocialMediaManager;

    private constructor() { }

    public static getInstance(): SocialMediaManager {
        if (!SocialMediaManager.instance) {
            SocialMediaManager.instance = new SocialMediaManager();
        }
        return SocialMediaManager.instance;
    }

    /**
     * Publica contenido en la plataforma especificada.
     */
    public async postContent(platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK', content: string, mediaUrl?: string) {
        console.log(`🚀 [SocialManager] Intentando publicar en ${platform}...`);

        switch (platform) {
            case 'FACEBOOK':
                return this.postToFacebook(content, mediaUrl);
            case 'INSTAGRAM':
                return this.postToInstagram(content, mediaUrl);
            case 'TIKTOK':
                return this.postToTikTok(content, mediaUrl);
            default:
                return { success: false, error: 'Plataforma no soportada' };
        }
    }

    private async postToFacebook(content: string, mediaUrl?: string) {
        const pageToken = process.env.FACEBOOK_PAGE_TOKEN;
        const pageId = process.env.FACEBOOK_PAGE_ID;

        if (!pageToken || !pageId) {
            console.error('❌ [Facebook] Faltan credenciales (FACEBOOK_PAGE_TOKEN o FACEBOOK_PAGE_ID).');
            return { success: false, error: 'Credenciales de Facebook no configuradas.' };
        }

        try {
            const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
            const params: any = {
                message: content,
                access_token: pageToken
            };

            if (mediaUrl) {
                // If it's an image/video link
                params.link = mediaUrl;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ [Facebook] Error API:', data);
                return { success: false, error: data.error?.message || 'Error al publicar en Facebook' };
            }

            console.log('✅ [Facebook] Publicado Exitosamente:', data.id);
            return { success: true, platformId: data.id };
        } catch (error: any) {
            console.error('❌ [Facebook] Error de Red:', error);
            return { success: false, error: error.message };
        }
    }

    private async postToInstagram(caption: string, imageUrl?: string) {
        const accessToken = process.env.FACEBOOK_PAGE_TOKEN; // Instagram usually shares the FB Page Token if linked
        const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

        if (!accessToken || !accountId) {
            console.error('❌ [Instagram] Faltan credenciales (FACEBOOK_PAGE_TOKEN o INSTAGRAM_ACCOUNT_ID).');
            return { success: false, error: 'Credenciales de Instagram no configuradas.' };
        }

        if (!imageUrl) {
            return { success: false, error: 'Instagram requiere una imagen obligatoriamente.' };
        }

        try {
            // Step 1: Create Media Container
            const createMediaUrl = `https://graph.facebook.com/v19.0/${accountId}/media`;
            const containerResponse = await fetch(createMediaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption: caption,
                    access_token: accessToken
                })
            });

            const containerData = await containerResponse.json();

            if (!containerResponse.ok || !containerData.id) {
                console.error('❌ [Instagram] Error Creando Media:', containerData);
                return { success: false, error: containerData.error?.message || 'Error subiendo imagen a IG' };
            }

            // Step 2: Publish Media
            const publishUrl = `https://graph.facebook.com/v19.0/${accountId}/media_publish`;
            const publishResponse = await fetch(publishUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: containerData.id,
                    access_token: accessToken
                })
            });

            const publishData = await publishResponse.json();

            if (!publishResponse.ok) {
                console.error('❌ [Instagram] Error Publicando:', publishData);
                return { success: false, error: publishData.error?.message || 'Error finalizando publicación en IG' };
            }

            console.log('✅ [Instagram] Publicado Exitosamente:', publishData.id);
            return { success: true, platformId: publishData.id };

        } catch (error: any) {
            console.error('❌ [Instagram] Error de Red:', error);
            return { success: false, error: error.message };
        }
    }

    private async postToTikTok(caption: string, videoUrl?: string) {
        // TikTok API Implementation needed
        console.log('✅ [TikTok] Publicado (Simulado)');
        return { success: true, platformId: 'tt_mock_id_' + Date.now() };
    }
}
