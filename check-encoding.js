const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const MOJIBAKE_PATTERNS = [
    { pattern: /Ã[±¡¿]/, name: 'UTF-8 read as Latin-1 (Spanish/Portuguese)' },
    { pattern: /ï¿½/, name: 'Replacement Character (Broken Bytes)' },
    { pattern: /â€™/, name: 'Windows-1252 Smart Quotes' },
    { pattern: /ðŸ/, name: 'Glitched Emoji' },
    { pattern: /&[a-z#0-9]+;/, name: 'Unescaped HTML Entity (e.g. &nbsp;)' }
];

let hasErrors = false;

console.log('🔍 Starting Encoding Safety Check...\n');

files.forEach(file => {
    const filePath = path.join(localesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Validate JSON Syntax
    try {
        JSON.parse(content);
    } catch (e) {
        console.error(`❌ [${file}] INVALID JSON SYNTAX: ${e.message}`);
        hasErrors = true;
        return;
    }

    // 2. Scan for Mojibake
    const lines = content.split('\n');
    let fileClean = true;

    lines.forEach((line, index) => {
        MOJIBAKE_PATTERNS.forEach(({ pattern, name }) => {
            if (pattern.test(line)) {
                console.error(`⚠️  [${file}] Possible Encoding Error on line ${index + 1}:`);
                console.error(`    Found: "${name}"`);
                console.error(`    Content: ${line.trim().substring(0, 100)}...`);
                fileClean = false;
                hasErrors = true;
            }
        });
    });

    if (fileClean) {
        // console.log(`✅ [${file}] Clean`);
    }
});

if (!hasErrors) {
    console.log('✨ ALL FILES ARE CLEAN! No weird symbols or broken encoding detected.');
    console.log(`checked ${files.length} language files.`);
} else {
    console.log('\n❌ Encoding issues found. Please review above.');
    process.exit(1);
}
