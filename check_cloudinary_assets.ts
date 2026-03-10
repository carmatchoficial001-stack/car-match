import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

async function checkLogo() {
    const logoPath = 'carmatch/branding/carmatch_logo_v20';
    console.log(`Checking for logo: ${logoPath}...`);
    try {
        const result = await cloudinary.api.resource(logoPath);
        console.log("✅ LOGO ENCONTRADO:", result.secure_url);
    } catch (e: any) {
        console.log("❌ LOGO NO ENCONTRADO O ERROR:", e.message);

        console.log("\nBuscando otros logos en carmatch/branding/...");
        try {
            const list = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'carmatch/branding/'
            });
            console.log("Archivos encontrados:");
            list.resources.forEach((r: any) => console.log(`- ${r.public_id}`));
        } catch (e2: any) {
            console.log("No se pudo listar la carpeta:", e2.message);
        }
    }
}

checkLogo();
