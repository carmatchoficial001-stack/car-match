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

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'es.json');

files.forEach(file => {
    try {
        const targetData = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
        const missing = getMissingKeys(sourceData, targetData);
        if (missing.length > 0) {
            console.log(`--- ${file} (Missing ${missing.length} keys) ---`);
            console.log(missing.join('\n'));
            console.log('\n');
        }
    } catch (e) {
        console.log(`Error reading ${file}`);
    }
});
