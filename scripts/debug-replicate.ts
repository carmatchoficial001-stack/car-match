import Replicate from 'replicate';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugReplicate() {
    const token = process.env.REPLICATE_API_TOKEN;

    console.log('🔍 [DIAGNÓSTICO REPLICATE]');
    console.log('--------------------------');

    if (!token || token === 'MISSING_TOKEN_DURING_BUILD') {
        console.error('❌ ERROR: REPLICATE_API_TOKEN no encontrado en .env');
        process.exit(1);
    }

    console.log('✅ Token detectado (primeros 5 caracteres):', token.substring(0, 5) + '...');

    const replicate = new Replicate({ auth: token });

    try {
        console.log('\n📡 Probando conexión con la API...');
        const model = await replicate.models.get("black-forest-labs", "flux-schnell");
        const latestVersion = model.latest_version?.id;
        console.log('✅ Conexión exitosa. Modelo Flux detectado.');
        console.log('📍 Versión más reciente de Flux:', latestVersion);

        const minimax = await replicate.models.get("minimax", "video-01");
        console.log('📍 Versión más reciente de Minimax:', minimax.latest_version?.id);

        console.log('\n🎨 Probando generación rápida (Flux-Schnell)...');
        const prediction = await replicate.predictions.create({
            // Use the discovered version or the handle if compatible
            model: "black-forest-labs/flux-schnell",
            input: {
                prompt: "A futuristic red sports car in Mexico City, cinematic lighting, 8k",
                aspect_ratio: "1:1",
                go_fast: true,
                output_format: "jpg"
            }
        });

        console.log('✅ Predicción creada con ID:', prediction.id);
        console.log('⏳ Estado inicial:', prediction.status);

        if (prediction.status === 'failed') {
            console.error('❌ La predicción falló inmediatamente:', prediction.error);
        } else {
            console.log('\n🚀 ¡Todo parece estar en orden con Replicate!');
            console.log('Si la generación falla en la app, revisa que el servidor tenga acceso a internet.');
        }

    } catch (error: any) {
        console.error('\n❌ ERROR CRÍTICO EN REPLICATE:');
        if (error.status === 401) {
            console.error('👉 Error 401: El Token es inválido o ha expirado.');
        } else if (error.status === 402) {
            console.error('👉 Error 402: Insuficientes créditos o falta método de pago en Replicate.');
        } else {
            console.error('👉 Mensaje:', error.message || error);
        }
        console.log('\nRevisa tu panel de Replicate en: https://replicate.com/account/billing');
    }
}

debugReplicate();
