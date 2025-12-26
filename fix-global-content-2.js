const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

// Dictionary of Native Translations for Critical Sections (Batch 2)
// Covering: ZH, KO, AR, HI, TR, NL, PL, SV, ID, TH, VI, UR, HE

const dictionaries = {
    zh: {
        terms: {
            title: "使用条款",
            acceptance_text: "下载、访问或使用 CarMatch，即表示您同意受这些条款和条件的约束。",
            liability_1_text: "CarMatch 不购买、出售或拥有列出的车辆。任何购买协议严格在买方和卖方之间进行。",
            fees_text: "根据我们当前的模式，车辆列表可能会收取费用（例如，免费期后的列表积分）。"
        },
        publish: { ai: { magic_desc: "正在生成神奇描述...", success: "车辆分析成功！", security_check: "安全检查" } },
        market: { cant_find_title: "找不到完美的车？", cant_find_desc: "在寻找的同时，您可以出售您的车！", publish_cta: "发布我的车辆" }
    },
    ko: {
        terms: {
            title: "이용 약관",
            acceptance_text: "CarMatch를 다운로드, 액세스 또는 사용함으로써 귀하는 이 약관에 동의하는 것입니다.",
            liability_1_text: "CarMatch는 등록된 차량을 구매, 판매 또는 소유하지 않습니다. 모든 구매 계약은 전적으로 구매자와 판매자 간의 것입니다.",
            fees_text: "차량 등록에는 현재 모델(예: 무료 기간 후 등록 크레딧)에 따라 수수료가 부과될 수 있습니다."
        },
        publish: { ai: { magic_desc: "매직 설명 생성 중...", success: "차량 분석 성공!", security_check: "보안 확인" } },
        market: { cant_find_title: "완벽한 차를 찾을 수 없나요?", cant_find_desc: "검색하는 동안 귀하의 차를 판매할 수 있습니다!", publish_cta: "내 차량 등록" }
    },
    ar: {
        terms: {
            title: "شروط وأحكام الاستخدام",
            acceptance_text: "عن طريق تنزيل أو الوصول إلى أو استخدام CarMatch ، فإنك توافق على الالتزام بهذه الشروط والأحكام.",
            liability_1_text: "لا تقوم CarMatch بشراء أو بيع أو امتلاك المركبات المدرجة. أي اتفاقية شراء تكون حصريًا بين المشتري والبائع.",
            fees_text: "قد تخضع قائمة المركبات لرسوم وفقًا لنموذجنا الحالي (على سبيل المثال ، اعتمادات القائمة بعد الفترة المجانية)."
        },
        publish: { ai: { magic_desc: "جاري إنشاء وصف سحري...", success: "تم تحليل المركبة بنجاح!", security_check: "فحص الأمان" } },
        market: { cant_find_title: "لا تجد السيارة المثالية؟", cant_find_desc: "بينما تبحث ، يمكنك بيع سيارتك!", publish_cta: "نشر مركبتي" }
    },
    hi: {
        terms: {
            title: "उपयोग के नियम और शर्तें",
            acceptance_text: "CarMatch को डाउनलोड, एक्सेस या उपयोग करके, आप इन नियमों और शर्तों से बंधे होने के लिए सहमत हैं।",
            liability_1_text: "CarMatch सूचीबद्ध वाहनों को खरीदता, बेचता या उनका मालिक नहीं है। कोई भी खरीद समझौता सख्ती से खरीदार और विक्रेता के बीच है।",
            fees_text: "वाहन सूचीकरण हमारे वर्तमान मॉडल (जैसे, निशुल्क अवधि के बाद सूचीकरण क्रेडिट) के अनुसार शुल्क के अधीन हो सकता है।"
        },
        publish: { ai: { magic_desc: "जादुई विवरण बना रहा है...", success: "वाहन का सफलतापूर्वक विश्लेषण किया गया!", security_check: "सुरक्षा जांच" } },
        market: { cant_find_title: "सही कार नहीं मिल रही?", cant_find_desc: "खोजते समय, आप अपनी कार बेच सकते हैं!", publish_cta: "मेरा वाहन प्रकाशित करें" }
    },
    tr: {
        terms: {
            title: "Kullanım Şartları ve Koşulları",
            acceptance_text: "CarMatch'i indirerek, erişerek veya kullanarak, bu Şartlar ve Koşullara bağlı kalmayı kabul edersiniz.",
            liability_1_text: "CarMatch, listelenen araçları satın almaz, satmaz veya bunlara sahip değildir. Herhangi bir satın alma sözleşmesi kesinlikle Alıcı ve Satıcı arasındadır."
        },
        publish: { ai: { magic_desc: "Sihirli açıklama oluşturuluyor...", success: "Araç başarıyla analiz edildi!", security_check: "Güvenlik Kontrolü" } },
        market: { cant_find_title: "Mükemmel arabayı bulamıyor musunuz?", cant_find_desc: "Ararken, sizinkini satabilirsiniz!", publish_cta: "Aracımı yayınla" }
    },
    nl: {
        terms: {
            title: "Algemene Voorwaarden",
            acceptance_text: "Door CarMatch te downloaden, te openen of te gebruiken, gaat u ermee akkoord gebonden te zijn aan deze Voorwaarden.",
            liability_1_text: "CarMatch koopt, verkoopt of bezit de vermelde voertuigen niet. Elke koopovereenkomst is strikt tussen de Koper en de Verkoper."
        },
        publish: { ai: { magic_desc: "Magische beschrijving maken...", success: "Voertuig succesvol geanalyseerd!", security_check: "Veiligheidscontrole" } },
        market: { cant_find_title: "Kun je de perfecte auto niet vinden?", cant_find_desc: "Terwijl je zoekt, kun je de jouwe verkopen!", publish_cta: "Mijn voertuig publiceren" }
    },
    pl: {
        terms: {
            title: "Warunki użytkowania",
            acceptance_text: "Pobierając, uzyskując dostęp lub korzystając z CarMatch, zgadzasz się na przestrzeganie niniejszych Warunków.",
            liability_1_text: "CarMatch nie kupuje, nie sprzedaje ani nie posiada wymienionych pojazdów. Wszelkie umowy kupna są zawierane wyłącznie między Kupującym a Sprzedającym."
        },
        publish: { ai: { magic_desc: "Tworzenie magicznego opisu...", success: "Pojazd pomyślnie przeanalizowany!", security_check: "Kontrola bezpieczeństwa" } },
        market: { cant_find_title: "Nie możesz znaleźć idealnego samochodu?", cant_find_desc: "Szukając, możesz sprzedać swój!", publish_cta: "Opublikuj mój pojazd" }
    },
    sv: {
        terms: {
            title: "Användarvillkor",
            acceptance_text: "Genom att ladda ner, komma åt eller använda CarMatch godkänner du att vara bunden av dessa villkor.",
            liability_1_text: "CarMatch köper, säljer eller äger inte de listade fordonen. Alla köpeavtal är strikt mellan köparen och säljaren."
        },
        publish: { ai: { magic_desc: "Skapar magisk beskrivning...", success: "Fordon analyserat framgångsrikt!", security_check: "Säkerhetskontroll" } },
        market: { cant_find_title: "Hittar du inte den perfekta bilen?", cant_find_desc: "Medan du söker kan du sälja din!", publish_cta: "Publicera mitt fordon" }
    },
    id: {
        terms: {
            title: "Syarat dan Ketentuan Penggunaan",
            acceptance_text: "Dengan mengunduh, mengakses, atau menggunakan CarMatch, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini.",
            liability_1_text: "CarMatch tidak membeli, menjual, atau memiliki kendaraan yang terdaftar. Setiap perjanjian pembelian sepenuhnya antara Pembeli dan Penjual."
        },
        publish: { ai: { magic_desc: "Membuat deskripsi ajaib...", success: "Kendaraan berhasil dianalisis!", security_check: "Pemeriksaan Keamanan" } },
        market: { cant_find_title: "Tidak dapat menemukan mobil yang sempurna?", cant_find_desc: "Sambil mencari, Anda bisa menjual mobil Anda!", publish_cta: "Publikasikan kendaraan saya" }
    },
    th: {
        terms: {
            title: "ข้อกำหนดและเงื่อนไขการใช้งาน",
            acceptance_text: "โดยการดาวน์โหลด เข้าถึง หรือใช้ CarMatch คุณตกลงที่จะผูกพันตามข้อกำหนดและเงื่อนไขเหล่านี้",
            liability_1_text: "CarMatch ไม่ได้ซื้อ ขาย หรือเป็นเจ้าของยานพาหนะที่ระบุไว้ ข้อตกลงการซื้อใดๆ เป็นเรื่องระหว่างผู้ซื้อและผู้ขายเท่านั้น"
        },
        publish: { ai: { magic_desc: "กำลังสร้างคำอธิบายมหัศจรรย์...", success: "วิเคราะห์ยานพาหนะสำเร็จ!", security_check: "การตรวจสอบความปลอดภัย" } },
        market: { cant_find_title: "หารถที่สมบูรณ์แบบไม่เจอ?", cant_find_desc: "ในขณะที่คุณค้นหา คุณสามารถขายของคุณได้!", publish_cta: "ลงประกาศยานพาหนะของฉัน" }
    },
    vi: {
        terms: {
            title: "Điều khoản và Điều kiện Sử dụng",
            acceptance_text: "Bằng cách tải xuống, truy cập hoặc sử dụng CarMatch, bạn đồng ý tuân thủ các Điều khoản và Điều kiện này.",
            liability_1_text: "CarMatch không mua, bán hoặc sở hữu các phương tiện được liệt kê. Mọi thỏa thuận mua bán hoàn toàn giữa Người mua và Người bán."
        },
        publish: { ai: { magic_desc: "Đang tạo mô tả kỳ diệu...", success: "Phân tích xe thành công!", security_check: "Kiểm tra bảo mật" } },
        market: { cant_find_title: "Không tìm thấy chiếc xe hoàn hảo?", cant_find_desc: "Trong khi tìm kiếm, bạn có thể bán xe của mình!", publish_cta: "Đăng xe của tôi" }
    },
    ur: {
        terms: {
            title: "استعمال کی شرائط و ضوابط",
            acceptance_text: "CarMatch کو ڈاؤن لوڈ، رسائی یا استعمال کرکے، آپ ان شرائط و ضوابط کے پابند ہونے سے اتفاق کرتے ہیں۔",
            liability_1_text: "CarMatch درج شدہ گاڑیوں کی خرید، فروخت یا ملکیت نہیں رکھتا ہے۔ کوئی بھی خریداری کا معاہدہ سختی سے خریدار اور بیچنے والے کے درمیان ہوتا ہے۔"
        },
        publish: { ai: { magic_desc: "جادوئی تفصیل بنا رہا ہے...", success: "گاڑی کا کامیابی سے تجزیہ کیا گیا!", security_check: "سیکیورٹی چیک" } },
        market: { cant_find_title: "کامل کار نہیں مل سکی؟", cant_find_desc: "تلاش کرتے وقت، آپ اپنی گاڑی بیچ سکتے ہیں!", publish_cta: "میری گاڑی شائع کریں" }
    },
    he: {
        terms: {
            title: "תנאי שימוש",
            acceptance_text: "על ידי הורדה, גישה או שימוש ב-CarMatch, אתה מסכים להיות מחויב לתנאים ולהגבלות אלה.",
            liability_1_text: "CarMatch אינה קונה, מוכרת או מחזיקה ברכבים הרשומים. כל הסכם רכישה הוא אך ורק בין הקונה למוכר."
        },
        publish: { ai: { magic_desc: "יוצר תיאור קסום...", success: "הרכב נותח בהצלחה!", security_check: "בדיקת אבטחה" } },
        market: { cant_find_title: "לא מוצא את הרכב המושלם?", cant_find_desc: "בזמן שאתה מחפש, אתה יכול למכור את שלך!", publish_cta: "פרסם את הרכב שלי" }
    }
};

// Apply updates
Object.keys(dictionaries).forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            // Merge Deeply
            const dict = dictionaries[lang];
            
            // Terms
            if (dict.terms && json.terms) Object.assign(json.terms, dict.terms);
            
            // Publish (AI only)
            if (dict.publish && dict.publish.ai && json.publish) {
                if (!json.publish.ai) json.publish.ai = {};
                Object.assign(json.publish.ai, dict.publish.ai);
            }

            // Market
            if (dict.market && json.market) Object.assign(json.market, dict.market);
            
            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Patched Global Content for ${lang}`);
        } catch (e) {
            console.error(`❌ Error patching ${lang}:`, e.message);
        }
    }
});
