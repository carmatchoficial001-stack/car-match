const fs = require('fs');
const path = require('path');

const localesDir = 'e:/carmatchapp/src/locales';
const sourceFile = path.join(localesDir, 'es.json');

function countKeys(obj) {
    let count = 0;
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            count += countKeys(obj[key]);
        } else {
            count++;
        }
    }
    return count;
}

function getMissingKeys(source, target, path = '') {
    let missing = [];
    for (const key in source) {
        const currentPath = path ? `${path}.${key}` : key;
        if (!(key in target)) {
            missing.push(currentPath);
        } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            missing = missing.concat(getMissingKeys(source[key], target[key], currentPath));
        }
    }
    return missing;
}

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
const totalKeys = countKeys(sourceData);

console.log(`Source of Truth (es.json): ${totalKeys} keys\n`);
console.log('| Language | File | Total Keys | Parity (%) | Missing Keys |');
console.log('|----------|------|------------|------------|--------------|');

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'es.json');

files.forEach(file => {
    try {
        const targetData = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
        const missing = getMissingKeys(sourceData, targetData);
        const presentKeys = totalKeys - missing.length;
        const percentage = ((presentKeys / totalKeys) * 100).toFixed(2);
        
        // Basic mapping for readability
        const langMap = {
            'en.json': 'English',
            'pt.json': 'Portuguese',
            'fr.json': 'French',
            'zh.json': 'Chinese',
            'de.json': 'German',
            'it.json': 'Italian',
            'ja.json': 'Japanese',
            'ru.json': 'Russian',
            'ko.json': 'Korean',
            'ar.json': 'Arabic',
            'hi.json': 'Hindi',
            'tr.json': 'Turkish',
            'vi.json': 'Vietnamese',
            'th.json': 'Thai',
            'id.json': 'Indonesian',
            'nl.json': 'Dutch',
            'pl.json': 'Polish',
            'sv.json': 'Swedish',
            'fi.json': 'Finnish',
            'he.json': 'Hebrew',
            'ur.json': 'Urdu'
        };
        
        const langName = langMap[file] || file;
        console.log(`| ${langName} | ${file} | ${presentKeys}/${totalKeys} | ${percentage}% | ${missing.length} |`);
    } catch (e) {
        console.log(`| ERROR | ${file} | - | - | - |`);
    }
});
