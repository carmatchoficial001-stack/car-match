const fs = require('fs').promises;
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const BASE_LANG = 'es';

const LANGUAGE_NAMES = {
    'es': 'Spanish',
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
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
    'ur': 'Urdu'
};

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

function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
}

async function validateTranslations() {
    console.log('🔍 CarMatch Translation Validator\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Cargar base
    const basePath = path.join(LOCALES_DIR, `${BASE_LANG}.json`);
    const baseData = JSON.parse(await fs.readFile(basePath, 'utf-8'));
    const baseKeys = getAllKeys(baseData);

    console.log(`✅ Base language (Spanish): ${baseKeys.length} keys\n`);

    // Validar todos los idiomas
    const files = await fs.readdir(LOCALES_DIR);
    const langFiles = files.filter(f => f.endsWith('.json'));

    const results = [];
    let allComplete = true;

    for (const file of langFiles) {
        const langCode = file.replace('.json', '');
        const langName = LANGUAGE_NAMES[langCode] || langCode;
        const langPath = path.join(LOCALES_DIR, file);

        const data = JSON.parse(await fs.readFile(langPath, 'utf-8'));
        const keys = getAllKeys(data);

        const missingKeys = baseKeys.filter(k => !keys.includes(k));
        const extraKeys = keys.filter(k => !baseKeys.includes(k));

        const status = missingKeys.length === 0 && extraKeys.length === 0;
        if (!status && langCode !== BASE_LANG) allComplete = false;

        results.push({
            code: langCode,
            name: langName,
            keys: keys.length,
            missing: missingKeys.length,
            extra: extraKeys.length,
            complete: status,
            missingList: missingKeys,
            extraList: extraKeys
        });
    }

    // Mostrar resultados
    console.log('📊 Validation Results:\n');
    console.log('┌─────────────────────┬───────────┬──────────┬────────┬─────────┐');
    console.log('│ Language            │ Keys      │ Missing  │ Extra  │ Status  │');
    console.log('├─────────────────────┼───────────┼──────────┼────────┼─────────┤');

    results.forEach(r => {
        const name = r.name.padEnd(19);
        const keys = String(r.keys).padStart(9);
        const missing = String(r.missing).padStart(8);
        const extra = String(r.extra).padStart(6);
        const status = r.complete ? '   ✅   ' : '   ⚠️   ';

        console.log(`│ ${name} │ ${keys} │ ${missing} │ ${extra} │ ${status} │`);
    });

    console.log('└─────────────────────┴───────────┴──────────┴────────┴─────────┘\n');

    // Detalles de problemas
    const incomplete = results.filter(r => !r.complete && r.code !== BASE_LANG);

    if (incomplete.length > 0) {
        console.log('⚠️  Incomplete Languages:\n');

        incomplete.forEach(r => {
            console.log(`${r.name} (${r.code}):`);
            if (r.missing.length > 0) {
                console.log(`  Missing ${r.missing.length} keys:`);
                r.missingList.slice(0, 5).forEach(k => console.log(`    - ${k}`));
                if (r.missing.length > 5) {
                    console.log(`    ... and ${r.missing.length - 5} more`);
                }
            }
            if (r.extra.length > 0) {
                console.log(`  Extra ${r.extra.length} keys (should be removed):`);
                r.extraList.slice(0, 5).forEach(k => console.log(`    - ${k}`));
                if (r.extra.length > 5) {
                    console.log(`    ... and ${r.extra.length - 5} more`);
                }
            }
            console.log('');
        });
    }

    // Resumen final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allComplete) {
        console.log('✅ ALL TRANSLATIONS COMPLETE! 🎉\n');
        console.log('🌍 CarMatch is ready for global launch! 🚀\n');
    } else {
        console.log(`⚠️  ${incomplete.length} language(s) need completion\n`);
        console.log('Run: node scripts/complete-translations.js\n');
    }
}

validateTranslations().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
