const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const englishVehicle = {
    "back_market": "Back to Market",
    "no_images": "No images",
    "condition_new": "New",
    "condition_used": "Used",
    "interested": "interested",
    "share_text": "Check out this {title} on CarMatch!",
    "seller": "Seller",
    "verified_seller": "Verified Seller"
};

const supportedLangs = ['ar', 'de', 'fr', 'he', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi', 'zh'];

supportedLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);

    if (fs.existsSync(filePath)) {
        console.log(`Processing ${lang}.json...`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            // Add vehicle section with English defaults
            json.vehicle = englishVehicle;

            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Updated ${lang}.json with Vehicle section`);

        } catch (e) {
            console.error(`❌ Error processing ${lang}.json:`, e.message);
        }
    }
});
