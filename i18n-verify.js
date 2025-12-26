const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, 'src', 'locales');
const SRC_DIR = path.join(__dirname, 'src');

// Helper to walk directory recursively
function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    const files = fs.readdirSync(dir);
    files.forEach(function (file) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            filelist.push(filepath);
        }
    });
    return filelist;
}

// 1. Get all translation keys from en.json (Source of Truth)
const enPath = path.join(LOCALES_DIR, 'en.json');
if (!fs.existsSync(enPath)) {
    console.error("❌ en.json not found!");
    process.exit(1);
}

let enKeys = new Set();
let enObj = {};

try {
    enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
} catch (e) {
    console.error("❌ Error parsing en.json:", e.message);
    process.exit(1);
}

function flattenKeys(obj, prefix = '') {
    let keys = [];
    for (const k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== null) {
            keys = keys.concat(flattenKeys(obj[k], prefix + k + '.'));
        } else {
            keys.push(prefix + k);
        }
    }
    return keys;
}

const allEnKeysList = flattenKeys(enObj);
enKeys = new Set(allEnKeysList);
console.log(`✅ Loaded ${enKeys.size} keys from en.json`);

// 2. Check all other locale files against en.json
const localeFiles = walkSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
let missingInLocales = {};
let fileErrors = [];

localeFiles.forEach(file => {
    const lang = path.basename(file, '.json');
    if (lang === 'en') return;

    try {
        const content = fs.readFileSync(file, 'utf8');
        const json = JSON.parse(content);
        const fileKeys = new Set(flattenKeys(json));

        const missing = allEnKeysList.filter(k => !fileKeys.has(k));
        if (missing.length > 0) {
            missingInLocales[lang] = missing;
        }
    } catch (e) {
        fileErrors.push(`❌ Error parsing ${lang}.json: ${e.message}`);
    }
});

// 3. Scan codebase for used keys (Simple regex approach, not perfect but good for sanity check)
// This looks for t('string') or t("string")
const srcFiles = walkSync(SRC_DIR).filter(f => /\.(tsx|ts|jsx|js)$/.test(f));
let usedKeys = new Set();

srcFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /\bt\(['"`]([\w.]+)['"`]\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        usedKeys.add(match[1]);
    }
});

console.log(`🔍 Found ${usedKeys.size} unique translation keys usage in code.`);

let usedButMissingInEn = [];
usedKeys.forEach(k => {
    // Startswith check because some keys might be constructed dynamically or be simple matches
    // But exact match is safer for strict check. 
    // Relaxed check: verify if the root matches at least
    if (!enKeys.has(k)) {
        usedButMissingInEn.push(k);
    }
});

// REPORT
console.log("\n--- 🌍 GLOBAL TRANSLATION REPORT ---");

if (fileErrors.length > 0) {
    console.log("\n🚨 FILE ERRORS:");
    fileErrors.forEach(e => console.log(e));
}

if (Object.keys(missingInLocales).length > 0) {
    console.log("\n🚨 MISSING TRANSLATIONS IN LOCALES (vs en.json):");
    for (const [lang, keys] of Object.entries(missingInLocales)) {
        console.log(`\n[${lang}] is missing ${keys.length} keys:`);
        // Show first 10 missing to save space
        keys.slice(0, 10).forEach(k => console.log(`  - ${k}`));
        if (keys.length > 10) console.log(`  ... and ${keys.length - 10} more.`);
    }
} else {
    console.log("\n✅ All locale files match the structure of known English keys!");
}

if (usedButMissingInEn.length > 0) {
    console.log("\n⚠️ KEYS USED IN CODE BUT MISSING IN en.json:");
    usedButMissingInEn.forEach(k => console.log(`  - ${k}`));
} else {
    console.log("\n✅ All keys used in code exist in en.json!");
}

console.log("\n------------------------------------");
