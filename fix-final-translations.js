const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const englishFavorites = {
    "title": "My Favorites",
    "subtitle": "Collection of vehicles you liked ({count})",
    "empty_title": "You have no favorites yet",
    "empty_text": "Explore CarMatch or MarketCar and like vehicles to save them here.",
    "explore_carmatch": "Explore CarMatch",
    "go_to_market": "Go to Market"
};

const englishNotifications = {
    "title": "Notifications",
    "mark_read": "Mark all as read",
    "loading": "Loading notifications...",
    "empty_title": "You have no notifications",
    "empty_text": "We will notify you when there is important activity on your account."
};

const supportedLangs = ['ar', 'de', 'fr', 'he', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi', 'zh'];

supportedLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);

    if (fs.existsSync(filePath)) {
        console.log(`Processing ${lang}.json...`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            // Add new sections
            json.favorites = englishFavorites;
            json.notifications = englishNotifications;

            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Updated ${lang}.json with Favorites & Notifications`);

        } catch (e) {
            console.error(`❌ Error processing ${lang}.json:`, e.message);
        }
    }
});
