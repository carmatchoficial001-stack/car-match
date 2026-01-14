const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, '../src/locales/es.json');
const enPath = path.join(__dirname, '../src/locales/en.json');

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            keys.push(newPrefix);
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                keys = keys.concat(getKeys(obj[key], newPrefix));
            }
        }
    }
    return keys;
}

function getObjectAtKey(obj, keyPath) {
    return keyPath.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

try {
    const esContent = JSON.parse(fs.readFileSync(esPath, 'utf8'));
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    // We want to find keys in ES that are missing in EN (or effectively missing)
    // We will do a recursive walk.

    const missingKeys = [];

    function check(esObj, enObj, currentPath = '') {
        for (const key in esObj) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;

            if (enObj === undefined || !enObj.hasOwnProperty(key)) {
                missingKeys.push(newPath);
                continue;
            }

            const esVal = esObj[key];
            const enVal = enObj[key];

            if (typeof esVal === 'object' && esVal !== null) {
                if (typeof enVal !== 'object' || enVal === null) {
                    // Type mismatch or EN is not object
                    missingKeys.push(newPath + " (Type Mismatch)");
                } else {
                    check(esVal, enVal, newPath);
                }
            }
        }
    }

    check(esContent, enContent);

    if (missingKeys.length > 0) {
        console.log("Found missing keys in en.json (present in es.json):");
        missingKeys.forEach(k => console.log(`- ${k}`));

        // Also let's print the content of the missing keys to help the AI generate translations
        console.log("\n--- Content of missing keys ---");
        const missingContent = {};
        missingKeys.forEach(k => {
            // If a parent key is missing, its children are effectively missing too, 
            // but we only listed the parent if the whole object is missing.
            // If we recurse deeply, we might list leaf nodes.
            // My check function lists the top-level missing key.
            // Let's grab the content from ES.
            const val = getObjectAtKey(esContent, k);
            // simplistic set
            let parts = k.split('.');
            let cursor = missingContent;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!cursor[parts[i]]) cursor[parts[i]] = {};
                cursor = cursor[parts[i]];
            }
            cursor[parts[parts.length - 1]] = val;
        });
        console.log(JSON.stringify(missingContent, null, 2));

    } else {
        console.log("No missing keys found! en.json structure matches es.json.");
    }

} catch (err) {
    console.error("Error:", err);
}
