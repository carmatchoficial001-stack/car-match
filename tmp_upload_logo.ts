
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function uploadLogo() {
    const logoPath = 'e:/carmatchapp/public/icon-512-v20.png'
    const buffer = fs.readFileSync(logoPath)

    console.log('Uploading logo v20 to Cloudinary...')
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

    console.log('Logo uploaded successfully:', (result as any).secure_url)
    console.log('Public ID:', (result as any).public_id)
}

uploadLogo().catch(console.error)
