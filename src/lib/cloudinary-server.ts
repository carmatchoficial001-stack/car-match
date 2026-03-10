import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Uploads an image from a URL to Cloudinary
 * @param url The external URL of the image
 * @param folder The folder in Cloudinary to store the image
 * @returns The secure URL and public_id
 */
export async function uploadUrlToCloudinary(url: string, folder: string = 'carmatch/publicity') {
    try {
        const result = await cloudinary.uploader.upload(url, {
            folder,
            resource_type: 'image',
        })
        return {
            success: true,
            secure_url: result.secure_url,
            public_id: result.public_id
        }
    } catch (error) {
        console.error('Error uploading URL to Cloudinary:', error)
        return { success: false, error: 'Error uploading image to Cloudinary' }
    }
}

/**
 * Uploads a buffer to Cloudinary (using upload_stream)
 */
export async function uploadBufferToCloudinary(buffer: Buffer, folder: string = 'carmatch/publicity') {
    return new Promise<{ success: boolean; secure_url?: string; public_id?: string; error?: string }>((resolve, reject) => {
        // 🛡️ TIMEOUT PROTECTOR (60s)
        const timeoutId = setTimeout(() => {
            resolve({ success: false, error: 'Cloudinary upload timeout (60s)' });
        }, 60000);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (error, result) => {
                clearTimeout(timeoutId);
                if (error) {
                    console.error('Error in upload_stream to Cloudinary:', error)
                    resolve({ success: false, error: error.message })
                } else {
                    resolve({
                        success: true,
                        secure_url: result?.secure_url,
                        public_id: result?.public_id
                    })
                }
            }
        )
        uploadStream.end(buffer)
    })
}
/**
 * Robustly uploads an image from a URL to Cloudinary.
 * Bypasses hotlinking blocks by using server-side fetch with browser-like headers,
 * validating buffer size to avoid 'black' or error images, and retrying on failure.
 */
export async function robustUploadToCloudinary(url: string, folder: string = 'carmatch/publicity', retries: number = 5) {
    const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

    let currentUrl = url;

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[CLOUDINARY] Intento ${i + 1}/${retries} para: ${currentUrl.substring(0, 100)}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout (Increased for Flux)

            const response = await fetch(currentUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': BROWSER_USER_AGENT,
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[CLOUDINARY] HTTP Error ${response.status}. Reintentando...`);
                if (i < retries - 1) {
                    await new Promise(r => setTimeout(r, 3000));
                    continue;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 🛡️ VALIDACIÓN DE BUFFER (Modo Terco)
            // Si el buffer es < 10KB, es un error de Cloudflare o imagen negra.
            if (buffer.length < 10000) {
                console.warn(`[CLOUDINARY] Buffer demasiado pequeño (${buffer.length} bytes). Reintentando...`);
                if (i < retries - 1) {
                    // 🔥 SEED BUSTER: Si la imagen salió negra/chica, forzamos un cambio de seed para Pollinations
                    const newSeed = Math.floor(Math.random() * 999999);
                    if (currentUrl.includes('seed=')) {
                        currentUrl = currentUrl.replace(/seed=\d+/, `seed=${newSeed}`);
                    } else {
                        currentUrl += `&seed=${newSeed}`;
                    }
                    console.log(`[CLOUDINARY] Cambiando seed para forzar regeneración: ${newSeed}`);

                    await new Promise(r => setTimeout(r, (i + 1) * 3000)); // Esperar cada vez más
                    continue;
                }
                throw new Error('Image too small (likely blocked or empty)');
            }

            console.log(`[CLOUDINARY] Buffer válido detectado (${buffer.length} bytes). Subiendo...`);
            const bufferRes = await uploadBufferToCloudinary(buffer, folder);

            if (bufferRes.success) {
                console.log(`[CLOUDINARY] ✅ Subida exitosa: ${bufferRes.secure_url}`);
                return bufferRes;
            }

            throw new Error(bufferRes.error || 'Upload failed');

        } catch (error: any) {
            console.error(`[CLOUDINARY] Error en intento ${i + 1}:`, error.message);
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, 2000));
            } else {
                return { success: false, error: `Fallo tras ${retries} intentos: ${error.message}` };
            }
        }
    }

    return { success: false, error: 'Max retries reached' };
}
