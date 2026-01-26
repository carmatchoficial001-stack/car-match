const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuración
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const BASE_LANG = 'es'; // Español como referencia completa
const BATCH_SIZE = 30; // Traducir 30 claves por request

// Mapeo de códigos de idioma a nombres completos
const LANGUAGE_NAMES = {
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
    'he': 'Hebrew',
    'ur': 'Urdu',
    'nah': 'Nahuatl',
    'myn': 'Mayan'
};

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Función para obtener todas las claves de un objeto JSON anidado
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Función para obtener valor de una clave anidada
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
}

// Función para establecer valor en una clave anidada
function setNestedValue(obj, keyPath, value) {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

// Función para crear un objeto JSON a partir de claves planas
function buildJsonFromKeys(keyValuePairs) {
    const result = {};
    for (const [key, value] of Object.entries(keyValuePairs)) {
        setNestedValue(result, key, value);
    }
    return result;
}

// Función para traducir un lote de claves usando Gemini con reintentos automáticos
async function translateBatch(keysToTranslate, baseData, targetLang, attempt = 1) {
    const langName = LANGUAGE_NAMES[targetLang] || targetLang;
    const MAX_RETRIES = 5;

    // Preparar el JSON a traducir
    const toTranslate = {};
    keysToTranslate.forEach(key => {
        toTranslate[key] = getNestedValue(baseData, key);
    });

    const prompt = `You are a professional translator specializing in automotive marketplace applications.

Translate the following JSON key-value pairs from Spanish to ${langName}.

CRITICAL RULES:
1. Preserve ALL variables like {count}, {name}, {title}, {current}, {total} EXACTLY as they appear
2. Preserve newline characters (\\n) EXACTLY as they appear
3. DO NOT translate these terms (keep as-is):
   - Brand names: CarMatch, MarketCar, MapStore
   - Technical terms: GPS, API, JSON, VIN, REPUVE, iOS, Android
   - Currency codes: MXN, USD, EUR
   - Units: km, cc, kg
4. Maintain the same tone (formal/informal) as the Spanish version
5. Return ONLY valid JSON with the same keys, translated values
6. Do not add explanations or additional text

Context: This is for a car buying/selling social network app.

Spanish JSON to translate:
${JSON.stringify(toTranslate, null, 2)}

Return the translated JSON:`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extraer JSON de la respuesta (puede venir con markdown)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        const translated = JSON.parse(jsonMatch[0]);
        return translated;
    } catch (error) {
        // Manejar error de cuota (429)
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
            if (attempt <= MAX_RETRIES) {
                // Intentar extraer el tiempo de espera recomendado (ej. "retry in 25s")
                let waitTime = Math.pow(2, attempt) * 5000; // Backoff básico (10s, 20s, 40s...)

                const retryMatch = error.message.match(/retry in ([\d.]+)s/);
                if (retryMatch) {
                    waitTime = (parseFloat(retryMatch[1]) + 2) * 1000;
                }

                console.warn(`   ⚠️  Rate limit hit. Retrying in ${Math.round(waitTime / 1000)}s... (Attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return translateBatch(keysToTranslate, baseData, targetLang, attempt + 1);
            }
        }

        console.error(`❌ Error translating batch to ${langName}:`, error.message);
        throw error;
    }
}

// Función principal
async function completeTranslations() {
    console.log('🌍 CarMatch Translation Completion Tool\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Cargar archivo base (español)
    const basePath = path.join(LOCALES_DIR, `${BASE_LANG}.json`);
    const baseData = JSON.parse(await fs.readFile(basePath, 'utf-8'));
    const baseKeys = getAllKeys(baseData);

    console.log(`✅ Loaded base language (Spanish): ${baseKeys.length} keys\n`);

    // 2. Obtener todos los archivos de idioma
    const files = await fs.readdir(LOCALES_DIR);
    const langFiles = files.filter(f => f.endsWith('.json') && f !== `${BASE_LANG}.json`);

    console.log(`📋 Found ${langFiles.length} languages to complete:\n`);

    // 3. Procesar cada idioma
    for (const file of langFiles) {
        const langCode = file.replace('.json', '');
        const langName = LANGUAGE_NAMES[langCode] || langCode;
        const langPath = path.join(LOCALES_DIR, file);

        console.log(`\n🔄 Processing: ${langName} (${langCode})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            // Cargar idioma actual
            const currentData = JSON.parse(await fs.readFile(langPath, 'utf-8'));
            const currentKeys = getAllKeys(currentData);

            // Encontrar claves faltantes
            const missingKeys = baseKeys.filter(key => !currentKeys.includes(key));

            if (missingKeys.length === 0) {
                console.log(`   ✅ Already complete! (${currentKeys.length} keys)`);
                continue;
            }

            console.log(`   📊 Current: ${currentKeys.length} keys`);
            console.log(`   ⚠️  Missing: ${missingKeys.length} keys`);
            console.log(`   🎯 Target: ${baseKeys.length} keys\n`);

            // Traducir en lotes
            const batches = [];
            for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
                batches.push(missingKeys.slice(i, i + BATCH_SIZE));
            }

            console.log(`   🤖 Translating in ${batches.length} batches...`);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`   ⏳ Batch ${i + 1}/${batches.length} (${batch.length} keys)...`);

                const translated = await translateBatch(batch, baseData, langCode);

                // Insertar traducciones
                for (const [key, value] of Object.entries(translated)) {
                    setNestedValue(currentData, key, value);
                }

                // Delay para no saturar la API
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            // Guardar archivo actualizado
            await fs.writeFile(langPath, JSON.stringify(currentData, null, 4), 'utf-8');

            const newKeyCount = getAllKeys(currentData).length;
            console.log(`   ✅ Completed! Now has ${newKeyCount} keys (+${missingKeys.length})`);

        } catch (error) {
            console.error(`   ❌ Error processing ${langName}:`, error.message);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Translation completion finished!\n');
    console.log('Next steps:');
    console.log('1. Run: node scripts/validate-translations.js');
    console.log('2. Test the app in different languages');
    console.log('3. Commit: git add src/locales/*.json && git commit -m "Complete all translations"');
    console.log('\n🌍 CarMatch is now ready for global domination! 🚀\n');
}

// Ejecutar
completeTranslations().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
