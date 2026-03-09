import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function fixLogo() {
    const publicId = 'carmatch/branding/carmatch_logo_v20'
    const logoPath = 'e:/carmatchapp/public/icon-512-v20.png'

    console.log(`Checking if logo exists: ${publicId}`)
    try {
        const resource = await cloudinary.api.resource(publicId)
        console.log('✅ Logo exists in Cloudinary:', resource.secure_url)
    } catch (error: any) {
        if (error.http_code === 404) {
            console.log('❌ Logo NOT found. Uploading...')
            if (!fs.existsSync(logoPath)) {
                console.error(`Local file not found: ${logoPath}`)
                return
            }
            const buffer = fs.readFileSync(logoPath)
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        public_id: 'carmatch_logo_v20',
                        folder: 'carmatch/branding',
                        resource_type: 'image',
                        overwrite: true
                    },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                ).end(buffer)
            })
            console.log('✅ Logo uploaded successfully:', (result as any).secure_url)
        } else {
            console.error('Error checking resource:', error.message)
        }
    }

    // Test derivation
    const testImageUrl = 'https://res.cloudinary.com/dnhhcnr5h/image/upload/v1772945549/carmatch/publicity/bpvuao2cc6376qvkqqlr.jpg'
    const logoLayer = 'l_carmatch:branding:carmatch_logo_v20,w_220,g_south_east,x_30,y_30,o_90'
    const derivedUrl = testImageUrl.replace('/upload/', `/upload/c_fill,h_1080,w_1080/q_auto,f_auto/${logoLayer}/fl_layer_apply/`)

    console.log('\nTesting derived URL...')
    console.log('Derived URL:', derivedUrl)

    // We can't easily check if the derived URL works from here without a fetch that Cloudinary might block or return 404
}

fixLogo().catch(console.error)
