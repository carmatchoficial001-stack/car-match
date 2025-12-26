const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const englishTermsPrivacy = {
    terms: {
        "title": "Terms and Conditions of Use",
        "last_updated": "Last updated",
        "acceptance_title": "1. Acceptance of Terms",
        "acceptance_text": "By downloading, accessing, or using CarMatch (\"the Platform\"), you agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, you must not use our services.",
        "liability_title": "2. Limitation of Liability (IMPORTANT)",
        "liability_intro": "CarMatch acts exclusively as a provider of digital intermediation and technology services.",
        "liability_1_title": "We are not part of the transaction",
        "liability_1_text": "CarMatch does not buy, sell, or own the listed vehicles. Any purchase agreement is strictly between the Buyer and Seller.",
        "liability_2_title": "We do not guarantee vehicles",
        "liability_2_text": "We do not inspect or guarantee the mechanical, legal, or physical condition of any vehicle. Descriptions are provided entirely by users.",
        "liability_3_title": "Negotiation disclaimer",
        "liability_3_text": "CarMatch is not responsible for disputes, fraud, non-payment, or any damage arising from negotiations or meetings between users.",
        "liability_4_title": "Safety Tips",
        "liability_4_text": "Our \"Safe Meeting Points\" suggestions or AI alerts are informational only and do not guarantee absolute safety. You are solely responsible for your personal safety.",
        "usage_title": "3. Platform Usage",
        "usage_text": "You agree to use CarMatch only for lawful purposes. Posting false, misleading content, or stolen vehicles is prohibited. We reserve the right to remove any post violating our community standards without notice.",
        "fees_title": "4. Fees and Payments",
        "fees_text": "Vehicle listing may be subject to fees according to our current model (e.g., listing credits after the free period). All fees are non-refundable unless stated otherwise.",
        "mapstore_title": "5. Map Store and Businesses",
        "mapstore_text": "Information shown in \"Map Store\" regarding workshops and businesses is referential. CarMatch does not endorse or guarantee the quality of services provided by third parties listed on the map.",
        "intellectual_title": "6. Intellectual Property",
        "intellectual_text": "All CarMatch content, brands, logos, and software are exclusive property of our holders. Users grant CarMatch a license to display their vehicle photos on the platform.",
        "contact_title": "7. Contact",
        "contact_text": "If you have questions about these terms, contact us via our official support in the app."
    },
    privacy: {
        "title": "Privacy Policy",
        "last_updated": "Last updated",
        "intro_title": "1. Introduction",
        "intro_text": "At CarMatch, we value and respect your privacy. This policy describes how we collect, use, and protect your personal information when using our app and web services.",
        "collect_title": "2. Information We Collect",
        "collect_1_title": "Registration Data",
        "collect_1_text": "Name, email, phone number, and encrypted password.",
        "collect_2_title": "Vehicle Information",
        "collect_2_text": "Details of cars you list (brand, model, photos, condition), which become public information.",
        "collect_3_title": "Location Data",
        "collect_3_text": "We use your location (GPS) for critical features like \"Map Store\" (finding nearby businesses) and showing relevant vehicles in your area.",
        "collect_4_title": "Interactions",
        "collect_4_text": "We log your \"Likes\" and \"Dislikes\" on CarMatch to improve our recommendations via AI.",
        "use_title": "3. Use of Information",
        "use_text": "We use your data to:",
        "use_1": "Facilitate buying and selling of vehicles.",
        "use_2": "Provide safety features, such as meeting point suggestions.",
        "use_3": "Improve our recommendation algorithms.",
        "use_4": "Prevent fraud via device fingerprint identification.",
        "share_title": "4. Sharing Information",
        "share_bold": "We do not sell your personal data to third parties.",
        "share_text": "We share information only:",
        "share_1": "With other users when you decide to contact them or publish a vehicle (your seller profile is public).",
        "share_2": "With legal authorities if required by law.",
        "security_title": "5. Data Security",
        "security_text": "We implement robust security measures to protect your data, including encryption in transit and at rest. However, remember that no system is 100% infallible.",
        "rights_title": "6. Your Rights",
        "rights_text": "You have the right to access, correct, or delete your personal information. You can manage most of this data directly from your user profile or contact support for complete account deletion."
    }
};

const supportedLangs = ['ar', 'de', 'fr', 'he', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi', 'zh'];

supportedLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);

    if (fs.existsSync(filePath)) {
        console.log(`Processing ${lang}.json...`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            // Directly inject English terms/privacy as fallback
            // Ideally we would want translations, but for legal text, 
            // English is better than missing keys or hardcoded Spanish.
            json.terms = englishTermsPrivacy.terms;
            json.privacy = englishTermsPrivacy.privacy;

            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Updated ${lang}.json with Legal sections`);

        } catch (e) {
            console.error(`❌ Error processing ${lang}.json:`, e.message);
        }
    }
});
