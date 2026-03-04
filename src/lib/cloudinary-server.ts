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
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (error, result) => {
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
 * First tries direct URL upload, then falls back to fetching the image buffer on the server
 * and uploading via stream to bypass hotlinking blocks (like Cloudflare 530).
 */
export async function robustUploadToCloudinary(url: string, folder: string = 'carmatch/publicity') {
    // 1. Try direct upload first (efficient)
    console.log(`[CLOUDINARY] Intentando subida directa para: ${url.substring(0, 100)}...`);
    const directRes = await uploadUrlToCloudinary(url, folder);
    if (directRes.success) return directRes;

    // 2. Fallback: Fetch buffer on server and upload (robust)
    console.log(`[CLOUDINARY] Subida directa falló. Intentando proxy via fetch buffer...`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const bufferRes = await uploadBufferToCloudinary(buffer, folder);
        return bufferRes;
    } catch (error) {
        console.error('[CLOUDINARY] Fallo total en subida robusta:', error);
        return { success: false, error: 'Failed robust upload' };
    }
}
