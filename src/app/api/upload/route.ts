// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { moderateUserContent } from '@/lib/ai/imageAnalyzer'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
    console.log('--- RECIBIDA PETICIÓN DE SUBIDA ---')
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const imageType = formData.get('imageType') as string || 'vehicle' // 'vehicle', 'profile', 'business'

        if (!file) {
            console.error('❌ No se recibió archivo')
            return NextResponse.json(
                { error: 'No se recibió ningún archivo' },
                { status: 400 }
            )
        }

        console.log(`📁 Archivo recibido: ${file.name} (${file.size} bytes) - Tipo: ${imageType}`)

        // Debug Cloud Config (Log bools only for security)
        const configCheck = {
            cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: !!process.env.CLOUDINARY_API_KEY,
            api_secret: !!process.env.CLOUDINARY_API_SECRET
        }
        console.log('🔧 Configuración Cloudinary:', configCheck)

        if (!configCheck.cloud_name || !configCheck.api_key || !configCheck.api_secret) {
            console.error('❌ Faltan credenciales en .env')
            return NextResponse.json(
                { error: 'Error de configuración del servidor' },
                { status: 500 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 🛡️ MODERACIÓN DE CONTENIDO (Solo para Perfil y Negocios)
        if (imageType === 'profile' || imageType === 'business') {
            const base64Image = buffer.toString('base64');
            const moderationResult = await moderateUserContent(base64Image);

            if (!moderationResult.isAppropriate) {
                console.warn(`⛔ Imagen bloqueada: ${moderationResult.reason}`);
                return NextResponse.json(
                    {
                        error: 'Imagen rechazada por moderación',
                        reason: moderationResult.reason,
                        category: moderationResult.category
                    },
                    { status: 400 }
                );
            }
        }

        console.log('🚀 Iniciando subida a Cloudinary...')

        // Upload to Cloudinary using a Promise wrapper
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'carmatch/vehicles',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Error Callback Cloudinary:', error)
                        reject(error)
                    }
                    else {
                        console.log('✅ Éxito Callback Cloudinary:', result?.secure_url)
                        resolve(result)
                    }
                }
            )

            uploadStream.on('error', (err) => {
                console.error('❌ Error Stream:', err)
                reject(err)
            })

            uploadStream.end(buffer)
        })

        console.log('🏁 Proceso finalizado con éxito')
        return NextResponse.json(result)

    } catch (error) {
        console.error('💥 ERROR DE SERVIDOR:', error)
        return NextResponse.json(
            { error: 'Error al subir la imagen' },
            { status: 500 }
        )
    }
}
