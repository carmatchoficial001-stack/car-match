const fs = require('fs');
const path = require('path');

console.log("🔍 Verificando configuración de entorno para Google OAuth...\n");

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.error("❌ ERROR: No se encontró el archivo .env en la raíz del proyecto.");
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let clientId = '';
let clientSecret = '';

lines.forEach(line => {
    if (line.startsWith('GOOGLE_CLIENT_ID=')) {
        clientId = line.split('=')[1].trim();
    }
    if (line.startsWith('GOOGLE_CLIENT_SECRET=')) {
        clientSecret = line.split('=')[1].trim();
    }
});

console.log("---------------------------------------------------");
console.log(`GOOGLE_CLIENT_ID encontrado: ${clientId ? "✅ SÍ" : "❌ NO"}`);
if (clientId) {
    console.log(`Longitud: ${clientId.length} caracteres`);
    console.log(`Valor (primeros 10 chars): ${clientId.substring(0, 10)}...`);
    console.log(`Valor (últimos 10 chars): ...${clientId.substring(clientId.length - 10)}`);

    if (clientId.includes('"') || clientId.includes("'")) {
        console.warn("⚠️ ADVERTENCIA: El ID contiene comillas. Asegúrate de que no sean parte del valor.");
    }
    if (clientId.endsWith('.apps.googleusercontent.com')) {
        console.log("✅ Formato correcto (termina en .apps.googleusercontent.com)");
    } else {
        console.error("❌ ERROR DE FORMATO: El ID no parece terminar en .apps.googleusercontent.com");
    }
}

console.log("---------------------------------------------------");
console.log(`GOOGLE_CLIENT_SECRET encontrado: ${clientSecret ? "✅ SÍ" : "❌ NO"}`);
if (clientSecret) {
    console.log(`Longitud: ${clientSecret.length} caracteres`);
    console.log(`Valor (primeros 3 chars): ${clientSecret.substring(0, 3)}...`);
}

console.log("---------------------------------------------------");
console.log("\nSi los valores anteriores parecen correctos, el problema podría ser:");
console.log("1. La URL de redirección en Google Cloud Console no coincide exactamente.");
console.log("   DEBE SER: http://localhost:3000/api/auth/callback/google");
console.log("2. El servidor de desarrollo necesita reiniciarse para leer los cambios del .env.");
console.log("\nPrueba ejecutar: npm run dev");
