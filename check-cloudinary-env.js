const fs = require('fs');
const path = require('path');

console.log("🔍 Verificando configuración de Cloudinary...\n");

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: No se encontró el archivo .env en la raíz del proyecto.");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let cloudName = '';
let uploadPreset = '';

lines.forEach(line => {
    // Buscar cloud name
    if (line.includes('CLOUDINARY_CLOUD_NAME=')) {
        if (line.startsWith('NEXT_PUBLIC_')) {
            cloudName = line.split('=')[1].trim();
            console.log("✅ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME encontrado.");
        } else {
            console.log("⚠️ Encontrado CLOUDINARY_CLOUD_NAME pero sin prefijo NEXT_PUBLIC_. Esto fallará en el cliente.");
        }
    }

    // Buscar upload preset
    if (line.includes('CLOUDINARY_UPLOAD_PRESET=')) {
        if (line.startsWith('NEXT_PUBLIC_')) {
            uploadPreset = line.split('=')[1].trim();
            console.log("✅ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET encontrado.");
        } else {
            console.log("⚠️ Encontrado CLOUDINARY_UPLOAD_PRESET pero sin prefijo NEXT_PUBLIC_. Esto fallará en el cliente.");
        }
    }
});

console.log("---------------------------------------------------");
console.log(`Cloud Name valor: ${cloudName ? (cloudName.length > 0 ? "OK (Longitud: " + cloudName.length + ")" : "VACÍO") : "❌ NO ENCONTRADO"}`);
console.log(`Upload Preset valor: ${uploadPreset ? (uploadPreset.length > 0 ? "OK (Longitud: " + uploadPreset.length + ")" : "VACÍO") : "❌ NO ENCONTRADO"}`);

if (!cloudName || !uploadPreset) {
    console.error("\n❌ Faltan variables. Asegúrate de que estén en el .env como:");
    console.error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...");
    console.error("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...");
} else {
    console.log("\n✅ Las variables parecen correctas en el archivo .env.");
    console.log("👉 Si el error persiste, REINICIA el servidor de desarrollo (Ctrl+C y npm run dev).");
}
