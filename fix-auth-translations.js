const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

// Translations for the Auth Section
const translations = {
    'de': {
        "welcome": "Willkommen bei CarMatch!",
        "login_subtitle": "Melden Sie sich mit Ihrem Google-Konto an, um Fahrzeuge zu entdecken",
        "continue_with": "Weiter mit",
        "coming_soon": "Demnächst",
        "agree_terms": "Indem Sie fortfahren, stimmen Sie unseren",
        "terms": "Nutzungsbedingungen",
        "privacy": "Datenschutzrichtlinie",
        "and": "und",
        "back_home": "Zurück zur Startseite"
    },
    'it': {
        "welcome": "Benvenuto in CarMatch!",
        "login_subtitle": "Accedi con il tuo account Google per iniziare a scoprire veicoli",
        "continue_with": "Continua con",
        "coming_soon": "Prossimamente",
        "agree_terms": "Continuando, accetti i nostri",
        "terms": "Termini",
        "privacy": "Politica sulla Privacy",
        "and": "e",
        "back_home": "Torna alla Home"
    },
    'ru': {
        "welcome": "Добро пожаловать в CarMatch!",
        "login_subtitle": "Войдите через Google, чтобы начать поиск автомобилей",
        "continue_with": "Продолжить с",
        "coming_soon": "Скоро",
        "agree_terms": "Продолжая, вы соглашаетесь с нашими",
        "terms": "Условиями",
        "privacy": "Политикой конфиденциальности",
        "and": "и",
        "back_home": "На главную"
    },
    'pt': {
        "welcome": "Bem-vindo ao CarMatch!",
        "login_subtitle": "Faça login com sua conta do Google para começar a descobrir veículos",
        "continue_with": "Continuar com",
        "coming_soon": "Em breve",
        "agree_terms": "Ao continuar, você concorda com nossos",
        "terms": "Termos",
        "privacy": "Política de Privacidade",
        "and": "e",
        "back_home": "Voltar ao Início"
    },
    'fr': {
        "welcome": "Bienvenue sur CarMatch !",
        "login_subtitle": "Connectez-vous avec votre compte Google pour commencer à découvrir des véhicules",
        "continue_with": "Continuer avec",
        "coming_soon": "Bientôt disponible",
        "agree_terms": "En continuant, vous acceptez nos",
        "terms": "Conditions",
        "privacy": "Politique de confidentialité",
        "and": "et",
        "back_home": "Retour à l'accueil"
    },
    'ja': {
        "welcome": "CarMatchへようこそ！",
        "login_subtitle": "Googleアカウントでログインして、車を探し始めましょう",
        "continue_with": "で続行",
        "coming_soon": "近日公開",
        "agree_terms": "続行することで、当社の",
        "terms": "利用規約",
        "privacy": "プライバシーポリシー",
        "and": "および",
        "back_home": "ホームに戻る"
    },
    'zh': {
        "welcome": "欢迎来到 CarMatch！",
        "login_subtitle": "使用您的 Google 帐户登录以开始探索车辆",
        "continue_with": "继续使用",
        "coming_soon": "即将推出",
        "agree_terms": "继续即表示您同意我们的",
        "terms": "条款",
        "privacy": "隐私政策",
        "and": "和",
        "back_home": "返回首页"
    },
    'ko': {
        "welcome": "CarMatch에 오신 것을 환영합니다!",
        "login_subtitle": "Google 계정으로 로그인하여 차량 탐색을 시작하세요",
        "continue_with": "계속하기",
        "coming_soon": "곧 출시",
        "agree_terms": "계속하면 당사의",
        "terms": "이용 약관",
        "privacy": "개인정보 처리방침",
        "and": "및",
        "back_home": "홈으로 돌아가기"
    },
    'ar': {
        "welcome": "مرحبًا بك في CarMatch!",
        "login_subtitle": "سجل الدخول بحساب Google لبدء استكشاف المركبات",
        "continue_with": "المتابعة باستخدام",
        "coming_soon": "قريباً",
        "agree_terms": "بالمتابعة، أنت توافق على",
        "terms": "الشروط",
        "privacy": "سياسة الخصوصية",
        "and": "و",
        "back_home": "العودة للرئيسية"
    },
    'pl': {
        "welcome": "Witaj w CarMatch!",
        "login_subtitle": "Zaloguj się za pomocą konta Google, aby zacząć odkrywać pojazdy",
        "continue_with": "Kontynuuj przez",
        "coming_soon": "Wkrótce",
        "agree_terms": "Kontynuując, zgadzasz się na nasze",
        "terms": "Warunki",
        "privacy": "Politykę Prywatności",
        "and": "i",
        "back_home": "Powrót do strony głównej"
    },
    'nl': {
        "welcome": "Welkom bij CarMatch!",
        "login_subtitle": "Log in met je Google-account om voertuigen te ontdekken",
        "continue_with": "Doorgaan met",
        "coming_soon": "Binnenkort",
        "agree_terms": "Door door te gaan, ga je akkoord met onze",
        "terms": "Voorwaarden",
        "privacy": "Privacybeleid",
        "and": "en",
        "back_home": "Terug naar Home"
    },
    'tr': {
        "welcome": "CarMatch'e Hoş Geldiniz!",
        "login_subtitle": "Araçları keşfetmeye başlamak için Google hesabınızla giriş yapın",
        "continue_with": "ile devam et",
        "coming_soon": "Çok Yakında",
        "agree_terms": "Devam ederek şunları kabul ediyorsunuz:",
        "terms": "Şartlar",
        "privacy": "Gizlilik Politikası",
        "and": "ve",
        "back_home": "Ana Sayfaya Dön"
    },
    'sv': {
        "welcome": "Välkommen till CarMatch!",
        "login_subtitle": "Logga in med ditt Google-konto för att börja upptäcka fordon",
        "continue_with": "Fortsätt med",
        "coming_soon": "Kommer snart",
        "agree_terms": "Genom att fortsätta godkänner du våra",
        "terms": "Villkor",
        "privacy": "Integritetspolicy",
        "and": "och",
        "back_home": "Tillbaka till Hem"
    },
    'hi': {
        "welcome": "CarMatch में आपका स्वागत है!",
        "login_subtitle": "वाहन खोजना शुरू करने के लिए अपने Google खाते से साइन इन करें",
        "continue_with": "के साथ जारी रखें",
        "coming_soon": "जल्द आ रहा है",
        "agree_terms": "जारी रखकर, आप हमारी",
        "terms": "शर्तें",
        "privacy": "गोपनीयता नीति",
        "and": "और",
        "back_home": "होम पर वापस"
    },
    'th': {
        "welcome": "ยินดีต้อนรับสู่ CarMatch!",
        "login_subtitle": "เข้าสู่ระบบด้วยบัญชี Google ของคุณเพื่อเริ่มค้นหายานพาหนะ",
        "continue_with": "ดำเนินการต่อด้วย",
        "coming_soon": "เร็วๆ นี้",
        "agree_terms": "การดำเนินการต่อแสดงว่าคุณยอมรับ",
        "terms": "เงื่อนไข",
        "privacy": "นโยบายความเป็นส่วนตัว",
        "and": "และ",
        "back_home": "กลับสู่หน้าหลัก"
    },
    'id': {
        "welcome": "Selamat datang di CarMatch!",
        "login_subtitle": "Masuk dengan akun Google Anda untuk mulai menemukan kendaraan",
        "continue_with": "Lanjutkan dengan",
        "coming_soon": "Segera Hadir",
        "agree_terms": "Dengan melanjutkan, Anda menyetujui",
        "terms": "Syarat",
        "privacy": "Kebijakan Privasi",
        "and": "dan",
        "back_home": "Kembali ke Beranda"
    },
    'vi': {
        "welcome": "Chào mừng đến với CarMatch!",
        "login_subtitle": "Đăng nhập bằng tài khoản Google của bạn để bắt đầu khám phá xe",
        "continue_with": "Tiếp tục với",
        "coming_soon": "Sắp ra mắt",
        "agree_terms": "Bằng cách tiếp tục, bạn đồng ý với",
        "terms": "Điều khoản",
        "privacy": "Chính sách quyền riêng tư",
        "and": "và",
        "back_home": "Trở về Trang chủ"
    },
    'he': {
        "welcome": "!CarMatch-ברוכים הבאים ל",
        "login_subtitle": "היכנס עם חשבון Google שלך כדי להתחיל לגלות רכבים",
        "continue_with": "המשך עם",
        "coming_soon": "בקרוב",
        "agree_terms": "המשך השימוש מהווה הסכמה ל",
        "terms": "תנאים",
        "privacy": "מדיניות פרטיות",
        "and": "ו",
        "back_home": "חזרה לדף הבית"
    },
    'ur': {
        "welcome": "!CarMatch میں خوش آمدید",
        "login_subtitle": "گاڑیاں دریافت کرنے کے لئے اپنے گوگل اکاؤنٹ سے سائن ان کریں",
        "continue_with": "کے ساتھ جاری رکھیں",
        "coming_soon": "جلد آ رہا ہے",
        "agree_terms": "جاری رکھ کر، آپ ہماری",
        "terms": "شرائط",
        "privacy": "پرائیویسی پالیسی",
        "and": "اور",
        "back_home": "گھر واپس"
    }
};

const supportedLangs = Object.keys(translations);

supportedLangs.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);

    if (fs.existsSync(filePath)) {
        console.log(`Processing ${lang}.json...`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            // Update auth section
            json.auth = translations[lang];

            // Write back
            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Updated ${lang}.json`);

        } catch (e) {
            console.error(`❌ Error processing ${lang}.json:`, e.message);
        }
    } else {
        console.warn(`⚠️ File ${lang}.json not found.`);
    }
});
