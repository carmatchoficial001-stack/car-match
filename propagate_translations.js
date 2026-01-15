const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const enFile = path.join(localesDir, 'en.json');

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// Keys to propagate
const keysToPropagate = ['settings', 'sos', 'appointments', 'taxonomy'];
const swipeKeys = [
    'business_badge', 'view_more', 'seen_all_title', 'seen_all_desc',
    'expand_btn', 'like_btn', 'nope_btn', 'overlay_like', 'overlay_nope'
];

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json' && f !== 'es.json');

// Also include es.json if needed, but I already updated it. Let's include everything except en.json to be safe and consistent.
const allFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

allFiles.forEach(file => {
    const filePath = path.join(localesDir, file);
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update settings, sos, appointments
    keysToPropagate.forEach(key => {
        if (!data[key]) {
            data[key] = enData[key];
        } else {
            // Deep merge or just add missing sub-keys
            Object.keys(enData[key]).forEach(subKey => {
                if (!data[key][subKey]) {
                    data[key][subKey] = enData[key][subKey];
                }
            });
        }
    });

    // Update swipe
    if (!data.swipe) data.swipe = {};
    swipeKeys.forEach(key => {
        if (!data.swipe[key]) {
            data.swipe[key] = enData.swipe[key];
        }
    });

    // Also standardize publish.tips if they are in map_store
    if (data.map_store && data.map_store.tips && (!data.publish || !data.publish.tips)) {
        if (!data.publish) data.publish = {};
        data.publish.tips = data.map_store.tips;
    }

    // Add missing publish labels
    if (enData.publish && enData.publish.labels) {
        if (!data.publish) data.publish = {};
        if (!data.publish.labels) data.publish.labels = {};
        ['traction', 'passengers'].forEach(l => {
            if (!data.publish.labels[l]) {
                data.publish.labels[l] = enData.publish.labels[l];
            }
        });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Updated ${file}`);
});
