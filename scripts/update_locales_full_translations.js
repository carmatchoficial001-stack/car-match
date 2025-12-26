const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Comprehensive dictionary for all 21 languages
const dictionary = {
    // Already done or verifying: es, en, pt, fr, de, it
    // Adding: ru, zh, ja, ko, ar, hi, tr, nl, pl, sv, vi, th, id, he, ur

    ru: { // Russian
        map_store: {
            loading: "Загрузка карты...",
            loading_location: "Определение местоположения...",
            location_required: "Требуется местоположение",
            location_permission_msg: "MapStore требуется ваше местоположение, чтобы показать ближайшие автосервисы",
            location_access_msg: "MapStore необходим доступ к вашему местоположению для отображения автобизнеса рядом с вами.",
            allow_gps: "Разрешить GPS",
            manual_location: "Ввести вручную",
            how_to_activate: "Как включить геолокацию?",
            step_1: "Нажмите на значок замка/локации в адресной строке",
            step_2: "Выберите «Разрешить» для доступа к геоданным",
            step_3: "Нажмите «Разрешить GPS» снова",
            manual_tip: "Или введите город вручную, чтобы увидеть бизнес в этом районе",
            publish_business: "Добавить мой бизнес",
            smart_search_label: "Какая у вас проблема?",
            smart_search_placeholder: "Напр. Странный звук при торможении...",
            ask_specialist: "Спросить специалиста",
            analyzing: "Анализ...",
            filter_success: "✅ Готово, фильтры применены",
            diagnosis: "🤖 Диагноз:",
            no_matches: "⚠️ Совпадений не найдено. Попробуйте точнее (напр. «тормоза», «двигатель»).",
            specialist_placeholder: "👨‍🔧 Наши специалисты анализируют ваш случай...",
            default_placeholder: "Опишите неисправность, и мы порекомендуем идеальные мастерские.",
            categories_label: "Категории",
            clean_filters: "Сбросить",
            modal_title: "Выбор местоположения",
            modal_desc: "Введите город или страну (напр. «Москва», «Saint Petersburg»).",
            country_label: "Страна",
            country_placeholder: "Напр. Россия, Казахстан...",
            state_label: "Область / Регион",
            state_placeholder: "Напр. Московская область...",
            city_label: "Город",
            city_placeholder: "Напр. Казань, Новосибирск...",
            cancel: "Отмена",
            search: "Поиск",
            global_search_tip: "💡 Совет: Вы можете искать любой город мира."
        },
        business_details: {
            website: "Веб-сайт",
            call: "Позвонить",
            about: "О бизнесе",
            location: "Адрес",
            view_map: "На карте",
            navigate_gps: "Навигатор",
            hours: "Часы работы",
            services: "🛠️ Услуги",
            features: {
                "24_hours": "🕒 24 часа",
                "emergency": "🚑 Эвакуатор",
                "home_service": "🏠 Выезд на дом"
            }
        },
        map_locator: {
            view_details: "Подробнее",
            loading_3d: "Загрузка 3D карты..."
        }
    },
    zh: { // Chinese (Simplified)
        map_store: {
            loading: "正在加载地图...",
            loading_location: "正在获取您的位置...",
            location_required: "需要位置权限",
            location_permission_msg: "MapStore 需要您的位置以显示附近的汽车服务商家",
            location_access_msg: "MapStore 需要访问您的位置以显示附近的商家。",
            allow_gps: "允许 GPS 定位",
            manual_location: "手动输入位置",
            how_to_activate: "如何开启定位？",
            step_1: "点击地址栏中的定位图标",
            step_2: "在浏览器请求权限时选择“允许”",
            step_3: "再次点击“允许 GPS 定位”",
            manual_tip: "或者您可以手动输入城市以查看该地区的商家",
            publish_business: "发布我的商家",
            smart_search_label: "遇到什么问题？",
            smart_search_placeholder: "例如：刹车时有奇怪的噪音...",
            ask_specialist: "咨询专家",
            analyzing: "正在分析...",
            filter_success: "✅ 就绪，过滤器已激活",
            diagnosis: "🤖 诊断结果：",
            no_matches: "⚠️ 未找到匹配项。请尝试更具体（例如“刹车”、“发动机”）。",
            specialist_placeholder: "👨‍🔧 我们的专家正在分析您的情况...",
            default_placeholder: "描述您的故障，我们的团队将为您推荐理想的维修店。",
            categories_label: "分类",
            clean_filters: "清除",
            modal_title: "选择位置",
            modal_desc: "输入您的城市或国家（例如“北京”、“上海”、“东京”）。",
            country_label: "国家",
            country_placeholder: "例如：中国、美国...",
            state_label: "省份 / 地区",
            state_placeholder: "例如：广东、江苏...",
            city_label: "城市",
            city_placeholder: "例如：深圳、成都...",
            cancel: "取消",
            search: "搜索",
            global_search_tip: "💡 提示：您可以搜索世界上的任何城市。"
        },
        business_details: {
            website: "网站",
            call: "拨打电话",
            about: "关于商家",
            location: "位置",
            view_map: "在地图上查看",
            navigate_gps: "GPS 导航",
            hours: "营业时间",
            services: "🛠️ 提供服务",
            features: {
                "24_hours": "🕒 24 小时",
                "emergency": "🚑 紧急服务",
                "home_service": "🏠 上门服务"
            }
        },
        map_locator: {
            view_details: "查看详情",
            loading_3d: "正在加载 3D 地图..."
        }
    },
    ja: { // Japanese
        map_store: {
            loading: "地図を読み込んでいます...",
            loading_location: "現在地を取得中...",
            location_required: "位置情報が必要です",
            location_permission_msg: "近くの自動車関連ショップを表示するには位置情報が必要です",
            location_access_msg: "MapStoreは近くのお店を表示するために位置情報へのアクセスが必要です。",
            allow_gps: "GPSを許可",
            manual_location: "手動で場所を入力",
            how_to_activate: "位置情報をオンにするには？",
            step_1: "アドレスバーの場所アイコンをクリック",
            step_2: "許可を求められたら「許可」を選択",
            step_3: "もう一度「GPSを許可」をクリック",
            manual_tip: "または、都市名を手動で入力してそのエリアのお店を探せます",
            publish_business: "ビジネスを登録",
            smart_search_label: "どのような問題がありますか？",
            smart_search_placeholder: "例：ブレーキをかけると変な音がする...",
            ask_specialist: "専門家に聞く",
            analyzing: "分析中...",
            filter_success: "✅ 完了、フィルターを適用しました",
            diagnosis: "🤖 診断結果:",
            no_matches: "⚠️ 一致する項目がありません。「ブレーキ」「エンジン」など具体的に入力してください。",
            specialist_placeholder: "👨‍🔧 専門家があなたのケースを分析しています...",
            default_placeholder: "故障内容を入力してください。最適な整備工場を提案します。",
            categories_label: "カテゴリー",
            clean_filters: "クリア",
            modal_title: "場所を選択",
            modal_desc: "都市名や国名を入力してください（例：「東京」「大阪」「ニューヨーク」）。",
            country_label: "国",
            country_placeholder: "例：日本、アメリカ...",
            state_label: "都道府県",
            state_placeholder: "例：東京都、北海道...",
            city_label: "市区町村",
            city_placeholder: "例：横浜市、名古屋市...",
            cancel: "キャンセル",
            search: "検索",
            global_search_tip: "💡 ヒント：世界中のどの都市でも検索できます。"
        },
        business_details: {
            website: "ウェブサイト",
            call: "電話する",
            about: "ビジネスについて",
            location: "所在地",
            view_map: "地図で見る",
            navigate_gps: "GPSナビ",
            hours: "営業時間",
            services: "🛠️ 提供サービス",
            features: {
                "24_hours": "🕒 24時間営業",
                "emergency": "🚑 緊急対応",
                "home_service": "🏠 出張サービス"
            }
        },
        map_locator: {
            view_details: "詳細を見る",
            loading_3d: "3Dマップを読み込み中..."
        }
    },
    ko: { // Korean
        map_store: {
            loading: "지도 로딩 중...",
            loading_location: "위치 확인 중...",
            location_required: "위치 정보 필요",
            location_permission_msg: "주변 자동차 관련 업체를 표시하려면 위치 정보가 필요합니다",
            location_access_msg: "MapStore에서 주변 업체를 보여드리기 위해 위치 접근 권한이 필요합니다.",
            allow_gps: "GPS 허용",
            manual_location: "위치 직접 입력",
            how_to_activate: "위치 기능을 켜는 방법?",
            step_1: "주소 표시줄의 위치 아이콘 클릭",
            step_2: "브라우저 요청 시 '허용' 선택",
            step_3: "'GPS 허용' 다시 클릭",
            manual_tip: "또는 도시를 직접 입력하여 해당 지역의 업체를 찾을 수 있습니다",
            publish_business: "내 비즈니스 등록",
            smart_search_label: "어떤 문제가 있나요?",
            smart_search_placeholder: "예: 브레이크 밟을 때 이상한 소리가 나요...",
            ask_specialist: "전문가에게 문의",
            analyzing: "분석 중...",
            filter_success: "✅ 완료, 필터 적용됨",
            diagnosis: "🤖 진단 결과:",
            no_matches: "⚠️ 검색 결과가 없습니다. 더 구체적으로 입력해보세요 (예: '브레이크', '엔진').",
            specialist_placeholder: "👨‍🔧 전문가가 분석 중입니다...",
            default_placeholder: "고장 증상을 설명해주시면 적합한 정비소를 추천해드립니다.",
            categories_label: "카테고리",
            clean_filters: "초기화",
            modal_title: "위치 선택",
            modal_desc: "도시나 국가를 입력하세요 (예: '서울', '부산', '뉴욕').",
            country_label: "국가",
            country_placeholder: "예: 대한민국, 미국...",
            state_label: "도 / 시",
            state_placeholder: "예: 경기도, 강원도...",
            city_label: "시 / 군 / 구",
            city_placeholder: "예: 강남구, 해운대구...",
            cancel: "취소",
            search: "검색",
            global_search_tip: "💡 팁: 전 세계 모든 도시를 검색할 수 있습니다."
        },
        business_details: {
            website: "웹사이트",
            call: "전화하기",
            about: "업체 소개",
            location: "위치",
            view_map: "지도에서 보기",
            navigate_gps: "GPS 내비게이션",
            hours: "영업 시간",
            services: "🛠️ 제공 서비스",
            features: {
                "24_hours": "🕒 24시간",
                "emergency": "🚑 긴급 출동",
                "home_service": "🏠 방문 서비스"
            }
        },
        map_locator: {
            view_details: "상세 보기",
            loading_3d: "3D 지도 로딩 중..."
        }
    },
    ar: { // Arabic
        map_store: {
            loading: "جارٍ تحميل الخريطة...",
            loading_location: "جارٍ تحديد موقعك...",
            location_required: "الموقع مطلوب",
            location_permission_msg: "تحتاج MapStore إلى موقعك لإظهار الشركات القريبة",
            location_access_msg: "MapStore يحتاج إلى الوصول لموقعك لعرض خدمات السيارات القريبة منك.",
            allow_gps: "السماح بـ GPS",
            manual_location: "إدخال الموقع يدوياً",
            how_to_activate: "كيف تفعل الموقع؟",
            step_1: "انقر على رمز الموقع في شريط العنوان",
            step_2: "اختر \"سماح\" عندما يطلب المتصفح ذلك",
            step_3: "انقر على \"السماح بـ GPS\" مرة أخرى",
            manual_tip: "أو يمكنك إدخال مدينتك يدوياً لرؤية المتاجر في تلك المنطقة",
            publish_business: "نشر علامتي التجارية",
            smart_search_label: "ما هي المشكلة؟",
            smart_search_placeholder: "مثال: سيارتي تصدر صوتاً غريباً عند الفرامل...",
            ask_specialist: "اسأل المختص",
            analyzing: "جارٍ التحليل...",
            filter_success: "✅ جاهز، تم تفعيل الفلاتر",
            diagnosis: "🤖 التشخيص:",
            no_matches: "⚠️ لم يتم العثور على نتائج. حاول أن تكون أكثر دقة (مثل \"فرامل\"، \"محرك\").",
            specialist_placeholder: "👨‍🔧 خبراؤنا يحللون حالتك...",
            default_placeholder: "صف العطل وسيقوم فريقنا باقتراح الورش المثالية.",
            categories_label: "الفئات",
            clean_filters: "مسح",
            modal_title: "تحديد الموقع",
            modal_desc: "أدخل مدينتك أو دولتك لرؤية الأعمال في تلك المنطقة (مثال: \"دبي\"، \"الرياض\"، \"القاهرة\").",
            country_label: "الدولة",
            country_placeholder: "مثال: السعودية، مصر...",
            state_label: "المنطقة / المحافظة",
            state_placeholder: "مثال: مكة، القاهرة...",
            city_label: "المدينة",
            city_placeholder: "مثال: جدة، الإسكندرية...",
            cancel: "إلغاء",
            search: "بحث",
            global_search_tip: "💡 تلميح: يمكنك البحث عن أي مدينة في العالم."
        },
        business_details: {
            website: "الموقع الإلكتروني",
            call: "اتصال",
            about: "حول النشاط التجاري",
            location: "الموقع",
            view_map: "عرض على الخريطة",
            navigate_gps: "الملاحة GPS",
            hours: "ساعات العمل",
            services: "🛠️ الخدمات المقدمة",
            features: {
                "24_hours": "🕒 24 ساعة",
                "emergency": "🚑 طوارئ",
                "home_service": "🏠 خدمة منزلية"
            }
        },
        map_locator: {
            view_details: "عرض التفاصيل",
            loading_3d: "جارٍ تحميل خريطة ثلاثية الأبعاد..."
        }
    },
    hi: { // Hindi
        map_store: {
            loading: "नक्शा लोड हो रहा है...",
            loading_location: "आपका स्थान प्राप्त किया जा रहा है...",
            location_required: "स्थान आवश्यक है",
            location_permission_msg: "आस-पास के ऑटोमोटिव व्यवसाय दिखाने के लिए MapStore को आपके स्थान की आवश्यकता है",
            location_access_msg: "MapStore को आपके आस-पास व्यवसाय दिखाने के लिए आपके स्थान तक पहुंच की आवश्यकता है।",
            allow_gps: "GPS की अनुमति दें",
            manual_location: "स्थान मैन्युअल रूप से दर्ज करें",
            how_to_activate: "स्थान कैसे सक्रिय करें?",
            step_1: "एड्रेस बार में स्थान आइकन पर क्लिक करें",
            step_2: "ब्राउज़र द्वारा पूछे जाने पर \"अनुमति दें\" चुनें",
            step_3: "फिर से \"GPS की अनुमति दें\" पर क्लिक करें",
            manual_tip: "या आप उस क्षेत्र में व्यवसाय देखने के लिए अपना शहर मैन्युअल रूप से दर्ज कर सकते हैं",
            publish_business: "मेरा व्यवसाय प्रकाशित करें",
            smart_search_label: "क्या समस्या है?",
            smart_search_placeholder: "उदा. ब्रेक लगाते समय मेरी कार से अजीब आवाज आती है...",
            ask_specialist: "विशेषज्ञ से पूछें",
            analyzing: "विश्लेषण हो रहा है...",
            filter_success: "✅ तैयार, फ़िल्टर सक्रिय",
            diagnosis: "🤖 निदान:",
            no_matches: "⚠️ कोई मेल नहीं मिला। अधिक विशिष्ट होने का प्रयास करें (उदा. \"ब्रेक\", \"इंजन\")।",
            specialist_placeholder: "👨‍🔧 हमारे विशेषज्ञ आपके मामले का विश्लेषण कर रहे हैं...",
            default_placeholder: "अपनी समस्या का वर्णन करें और हमारी टीम आदर्श कार्यशालाओं की सिफारिश करेगी।",
            categories_label: "श्रेणियाँ",
            clean_filters: "साफ़ करें",
            modal_title: "स्थान चुनें",
            modal_desc: "उस क्षेत्र में व्यवसाय देखने के लिए अपना शहर या देश दर्ज करें (उदा. \"मुंबई\", \"दिल्ली\")।",
            country_label: "देश",
            country_placeholder: "उदा. भारत, यूएसए...",
            state_label: "राज्य",
            state_placeholder: "उदा. महाराष्ट्र, दिल्ली...",
            city_label: "शहर",
            city_placeholder: "उदा. पुणे, जयपुर...",
            cancel: "रद्द करें",
            search: "खोजें",
            global_search_tip: "💡 सुझाव: आप दुनिया के किसी भी शहर को खोज सकते हैं।"
        },
        business_details: {
            website: "वेबसाइट",
            call: "कॉल करें",
            about: "व्यवसाय के बारे में",
            location: "स्थान",
            view_map: "नक्शे पर देखें",
            navigate_gps: "GPS नेविगेशन",
            hours: "काम के घंटे",
            services: "🛠️ प्रदान की गई सेवाएँ",
            features: {
                "24_hours": "🕒 24 घंटे",
                "emergency": "🚑 आपातकालीन",
                "home_service": "🏠 होम सर्विस"
            }
        },
        map_locator: {
            view_details: "विवरण देखें",
            loading_3d: "3D नक्शा लोड हो रहा है..."
        }
    },
    tr: { // Turkish
        map_store: {
            loading: "Harita Yükleniyor...",
            loading_location: "Konumunuz alınıyor...",
            location_required: "Konum Gerekli",
            location_permission_msg: "MapStore, yakındaki otomotiv işletmelerini göstermek için konumunuza ihtiyaç duyar",
            location_access_msg: "MapStore'un size yakın işletmeleri göstermesi için konum erişimine ihtiyacı var.",
            allow_gps: "GPS'e İzin Ver",
            manual_location: "Konumu Elle Gir",
            how_to_activate: "Konum nasıl açılır?",
            step_1: "Adres çubuğundaki konum simgesine tıklayın",
            step_2: "Tarayıcı izin istediğinde \"İzin Ver\"i seçin",
            step_3: "Tekrar \"GPS'e İzin Ver\"e tıklayın",
            manual_tip: "Veya o bölgedeki işletmeleri görmek için şehrinizi elle girebilirsiniz",
            publish_business: "İşletmemi Yayınla",
            smart_search_label: "Sorun nedir?",
            smart_search_placeholder: "Örn. Fren yaparken arabamdan garip bir ses geliyor...",
            ask_specialist: "Uzmana Sor",
            analyzing: "Analiz ediliyor...",
            filter_success: "✅ Hazır, filtreler aktif",
            diagnosis: "🤖 Teşhis:",
            no_matches: "⚠️ Eşleşme bulunamadı. Daha spesifik olmayı deneyin (örn. \"fren\", \"motor\").",
            specialist_placeholder: "👨‍🔧 Uzmanlarımız durumunuzu analiz ediyor...",
            default_placeholder: "Arızanızı tanımlayın, ekibimiz size ideal atölyeleri önersin.",
            categories_label: "Kategoriler",
            clean_filters: "Temizle",
            modal_title: "Konum Seç",
            modal_desc: "O bölgedeki işletmeleri görmek için şehrinizi veya ülkenizi girin (örn. \"İstanbul\", \"Ankara\").",
            country_label: "Ülke",
            country_placeholder: "Örn. Türkiye, Almanya...",
            state_label: "İl / Eyalet",
            state_placeholder: "Örn. İzmir, Bursa...",
            city_label: "Şehir / İlçe",
            city_placeholder: "Örn. Kadıköy, Beşiktaş...",
            cancel: "İptal",
            search: "Ara",
            global_search_tip: "💡 İpucu: Dünyadaki herhangi bir şehri arayabilirsiniz."
        },
        business_details: {
            website: "Web Sitesi",
            call: "Ara",
            about: "İşletme Hakkında",
            location: "Konum",
            view_map: "Haritada Gör",
            navigate_gps: "GPS Navigasyon",
            hours: "Çalışma Saatleri",
            services: "🛠️ Sunulan Hizmetler",
            features: {
                "24_hours": "🕒 24 Saat",
                "emergency": "🚑 Acil Durum",
                "home_service": "🏠 Eve Servis"
            }
        },
        map_locator: {
            view_details: "Detayları Gör",
            loading_3d: "3D harita yükleniyor..."
        }
    },
    nl: { // Dutch
        map_store: {
            loading: "Kaart laden...",
            loading_location: "Locatie ophalen...",
            location_required: "Locatie vereist",
            location_permission_msg: "MapStore heeft uw locatie nodig om autobedrijven in de buurt te tonen",
            location_access_msg: "MapStore heeft toegang tot uw locatie nodig om bedrijven bij u in de buurt te tonen.",
            allow_gps: "GPS toestaan",
            manual_location: "Locatie handmatig invoeren",
            how_to_activate: "Hoe locatie activeren?",
            step_1: "Klik op het locatiepictogram in de adresbalk",
            step_2: "Selecteer \"Toestaan\" wanneer de browser om toestemming vraagt",
            step_3: "Klik opnieuw op \"GPS toestaan\"",
            manual_tip: "Of voer handmatig uw stad in om bedrijven in dat gebied te zien",
            publish_business: "Mijn bedrijf publiceren",
            smart_search_label: "Wat is het probleem?",
            smart_search_placeholder: "Bijv. Mijn auto maakt een raar geluid bij het remmen...",
            ask_specialist: "Vraag de specialist",
            analyzing: "Analyseren...",
            filter_success: "✅ Klaar, filters geactiveerd",
            diagnosis: "🤖 Diagnose:",
            no_matches: "⚠️ Geen overeenkomsten gevonden. Probeer specifieker te zijn (bijv. \"remmen\", \"motor\").",
            specialist_placeholder: "👨‍🔧 Onze specialisten analyseren uw geval...",
            default_placeholder: "Beschrijf uw storing en ons team zal de ideale werkplaatsen aanbevelen.",
            categories_label: "Categorieën",
            clean_filters: "Wissen",
            modal_title: "Selecteer locatie",
            modal_desc: "Voer uw stad of land in (bijv. \"Amsterdam\", \"Rotterdam\", \"Brussel\").",
            country_label: "Land",
            country_placeholder: "Bijv. Nederland, België...",
            state_label: "Provincie",
            state_placeholder: "Bijv. Noord-Holland...",
            city_label: "Stad",
            city_placeholder: "Bijv. Utrecht, Eindhoven...",
            cancel: "Annuleren",
            search: "Zoeken",
            global_search_tip: "💡 Tip: U kunt elke stad ter wereld zoeken."
        },
        business_details: {
            website: "Website",
            call: "Bellen",
            about: "Over het bedrijf",
            location: "Locatie",
            view_map: "Bekijk op kaart",
            navigate_gps: "GPS Navigatie",
            hours: "Openingstijden",
            services: "🛠️ Aangeboden diensten",
            features: {
                "24_hours": "🕒 24 Uur",
                "emergency": "🚑 Noodgeval",
                "home_service": "🏠 Huis-aan-huis service"
            }
        },
        map_locator: {
            view_details: "Details bekijken",
            loading_3d: "3D-kaart laden..."
        }
    },
    pl: { // Polish
        map_store: {
            loading: "Ładowanie mapy...",
            loading_location: "Pobieranie lokalizacji...",
            location_required: "Wymagana lokalizacja",
            location_permission_msg: "MapStore potrzebuje Twojej lokalizacji, aby pokazać pobliskie firmy motoryzacyjne",
            location_access_msg: "MapStore wymaga dostępu do lokalizacji, aby wyświetlić firmy w pobliżu.",
            allow_gps: "Zezwól na GPS",
            manual_location: "Wpisz lokalizację ręcznie",
            how_to_activate: "Jak włączyć lokalizację?",
            step_1: "Kliknij ikonę lokalizacji w pasku adresu",
            step_2: "Wybierz „Zezwól”, gdy przeglądarka zapyta o zgodę",
            step_3: "Kliknij ponownie „Zezwól na GPS”",
            manual_tip: "Możesz też wpisać miasto ręcznie, aby zobaczyć firmy w tym obszarze",
            publish_business: "Dodaj moją firmę",
            smart_search_label: "Jaki masz problem?",
            smart_search_placeholder: "Np. Samochód wydaje dziwny dźwięk przy hamowaniu...",
            ask_specialist: "Zapytaj specjalistę",
            analyzing: "Analizowanie...",
            filter_success: "✅ Gotowe, filtry aktywne",
            diagnosis: "🤖 Diagnoza:",
            no_matches: "⚠️ Nie znaleziono pasujących wyników. Spróbuj dokładniej (np. „hamulce”, „silnik”).",
            specialist_placeholder: "👨‍🔧 Nasi specjaliści analizują Twój przypadek...",
            default_placeholder: "Opisz usterkę, a nasz zespół poleci idealne warsztaty.",
            categories_label: "Kategorie",
            clean_filters: "Wyczyść",
            modal_title: "Wybierz lokalizację",
            modal_desc: "Wpisz miasto lub kraj (np. „Warszawa”, „Kraków”).",
            country_label: "Kraj",
            country_placeholder: "Np. Polska, Niemcy...",
            state_label: "Województwo",
            state_placeholder: "Np. Mazowieckie...",
            city_label: "Miasto",
            city_placeholder: "Np. Gdańsk, Poznań...",
            cancel: "Anuluj",
            search: "Szukaj",
            global_search_tip: "💡 Wskazówka: Możesz szukać dowolnego miasta na świecie."
        },
        business_details: {
            website: "Strona internetowa",
            call: "Zadzwoń",
            about: "O firmie",
            location: "Lokalizacja",
            view_map: "Pokaż na mapie",
            navigate_gps: "Nawiguj GPS",
            hours: "Godziny otwarcia",
            services: "🛠️ Oferowane usługi",
            features: {
                "24_hours": "🕒 24h",
                "emergency": "🚑 Pomoc drogowa",
                "home_service": "🏠 Dojazd do klienta"
            }
        },
        map_locator: {
            view_details: "Zobacz szczegóły",
            loading_3d: "Ładowanie mapy 3D..."
        }
    },
    sv: { // Swedish
        map_store: {
            loading: "Laddar karta...",
            loading_location: "Hämtar din plats...",
            location_required: "Plats krävs",
            location_permission_msg: "MapStore behöver din plats för att visa bilföretag i närheten",
            location_access_msg: "MapStore behöver tillgång till din plats för att visa företag nära dig.",
            allow_gps: "Tillåt GPS",
            manual_location: "Ange plats manuellt",
            how_to_activate: "Hur aktiverar man plats?",
            step_1: "Klicka på platsikonen i adressfältet",
            step_2: "Välj \"Tillåt\" när webbläsaren frågar",
            step_3: "Klicka på \"Tillåt GPS\" igen",
            manual_tip: "Eller så kan du ange din stad manuellt för att se företag i det området",
            publish_business: "Publicera mitt företag",
            smart_search_label: "Vad är problemet?",
            smart_search_placeholder: "T.ex. Bilen låter konstigt när jag bromsar...",
            ask_specialist: "Fråga specialisten",
            analyzing: "Analyserar...",
            filter_success: "✅ Klart, filter aktiverade",
            diagnosis: "🤖 Diagnos:",
            no_matches: "⚠️ Inga träffar. Försök vara mer specifik (t.ex. \"bromsar\", \"motor\").",
            specialist_placeholder: "👨‍🔧 Våra specialister analyserar ditt fall...",
            default_placeholder: "Beskriv felet så rekommenderar vårt team de bästa verkstäderna.",
            categories_label: "Kategorier",
            clean_filters: "Rensa",
            modal_title: "Välj plats",
            modal_desc: "Ange din stad eller land (t.ex. \"Stockholm\", \"Göteborg\").",
            country_label: "Land",
            country_placeholder: "T.ex. Sverige, Norge...",
            state_label: "Län",
            state_placeholder: "T.ex. Skåne...",
            city_label: "Stad",
            city_placeholder: "T.ex. Malmö, Uppsala...",
            cancel: "Avbryt",
            search: "Sök",
            global_search_tip: "💡 Tips: Du kan söka efter vilken stad som helst i världen."
        },
        business_details: {
            website: "Webbplats",
            call: "Ring",
            about: "Om företaget",
            location: "Plats",
            view_map: "Visa på karta",
            navigate_gps: "GPS-navigering",
            hours: "Öppettider",
            services: "🛠️ Tjänster",
            features: {
                "24_hours": "🕒 24 Timmar",
                "emergency": "🚑 Akut",
                "home_service": "🏠 Hemservice"
            }
        },
        map_locator: {
            view_details: "Visa detaljer",
            loading_3d: "Laddar 3D-karta..."
        }
    },
    vi: { // Vietnamese
        map_store: {
            loading: "Đang tải bản đồ...",
            loading_location: "Đang lấy vị trí của bạn...",
            location_required: "Yêu cầu vị trí",
            location_permission_msg: "MapStore cần vị trí của bạn để hiển thị các doanh nghiệp ô tô gần đó",
            location_access_msg: "MapStore cần quyền truy cập vị trí để hiển thị các doanh nghiệp gần bạn.",
            allow_gps: "Cho phép GPS",
            manual_location: "Nhập vị trí thủ công",
            how_to_activate: "Làm thế nào để bật vị trí?",
            step_1: "Nhấp vào biểu tượng vị trí trên thanh địa chỉ",
            step_2: "Chọn \"Cho phép\" khi trình duyệt yêu cầu",
            step_3: "Nhấp lại vào \"Cho phép GPS\"",
            manual_tip: "Hoặc bạn có thể nhập thủ công thành phố để xem các doanh nghiệp trong khu vực đó",
            publish_business: "Đăng doanh nghiệp của tôi",
            smart_search_label: "Vấn đề là gì?",
            smart_search_placeholder: "VD: Xe tôi có tiếng kêu lạ khi phanh...",
            ask_specialist: "Hỏi chuyên gia",
            analyzing: "Đang phân tích...",
            filter_success: "✅ Sẵn sàng, bộ lọc đã kích hoạt",
            diagnosis: "🤖 Chẩn đoán:",
            no_matches: "⚠️ Không tìm thấy kết quả. Hãy thử cụ thể hơn (VD: \"phanh\", \"động cơ\").",
            specialist_placeholder: "👨‍🔧 Các chuyên gia của chúng tôi đang phân tích trường hợp của bạn...",
            default_placeholder: "Mô tả sự cố của bạn và đội ngũ của chúng tôi sẽ đề xuất các xưởng phù hợp.",
            categories_label: "Danh mục",
            clean_filters: "Xóa",
            modal_title: "Chọn vị trí",
            modal_desc: "Nhập thành phố hoặc quốc gia của bạn (VD: \"Hà Nội\", \"Hồ Chí Minh\").",
            country_label: "Quốc gia",
            country_placeholder: "VD: Việt Nam...",
            state_label: "Tỉnh / Thành phố",
            state_placeholder: "VD: Đà Nẵng...",
            city_label: "Quận / Huyện",
            city_placeholder: "VD: Ba Đình...",
            cancel: "Hủy",
            search: "Tìm kiếm",
            global_search_tip: "💡 Mẹo: Bạn có thể tìm kiếm bất kỳ thành phố nào trên thế giới."
        },
        business_details: {
            website: "Trang web",
            call: "Gọi điện",
            about: "Về doanh nghiệp",
            location: "Vị trí",
            view_map: "Xem trên bản đồ",
            navigate_gps: "Dẫn đường GPS",
            hours: "Giờ làm việc",
            services: "🛠️ Dịch vụ cung cấp",
            features: {
                "24_hours": "🕒 24 Giờ",
                "emergency": "🚑 Khẩn cấp",
                "home_service": "🏠 Dịch vụ tại nhà"
            }
        },
        map_locator: {
            view_details: "Xem chi tiết",
            loading_3d: "Đang tải bản đồ 3D..."
        }
    },
    th: { // Thai
        map_store: {
            loading: "กำลังโหลดแผนที่...",
            loading_location: "กำลังระบุตำแหน่งของคุณ...",
            location_required: "จำเป็นต้องใช้ตำแหน่ง",
            location_permission_msg: "MapStore ต้องการตำแหน่งของคุณเพื่อแสดงธุรกิจยานยนต์ในบริเวณใกล้เคียง",
            location_access_msg: "MapStore ต้องการการเข้าถึงตำแหน่งของคุณเพื่อแสดงธุรกิจใกล้ตัวคุณ",
            allow_gps: "อนุญาต GPS",
            manual_location: "ป้อนตำแหน่งด้วยตนเอง",
            how_to_activate: "วิธีเปิดใช้งานตำแหน่ง?",
            step_1: "คลิกที่ไอคอนตำแหน่งในแถบที่อยู่",
            step_2: "เลือก \"อนุญาต\" เมื่อเบราว์เซอร์ขออนุญาต",
            step_3: "คลิก \"อนุญาต GPS\" อีกครั้ง",
            manual_tip: "หรือคุณสามารถป้อนเมืองของคุณด้วยตนเองเพื่อดูธุรกิจในพื้นที่นั้น",
            publish_business: "ลงประกาศธุรกิจของฉัน",
            smart_search_label: "มีปัญหาอะไร?",
            smart_search_placeholder: "เช่น รถมีเสียงแปลกๆ เวลาเบรก...",
            ask_specialist: "ถามผู้เชี่ยวชาญ",
            analyzing: "กำลังวิเคราะห์...",
            filter_success: "✅ เรียบร้อย, ตัวกรองทำงานแล้ว",
            diagnosis: "🤖 การวินิจฉัย:",
            no_matches: "⚠️ ไม่พบข้อมูลที่ตรงกัน ลองระบุให้ชัดเจนขึ้น (เช่น \"เบรก\", \"เครื่องยนต์\")",
            specialist_placeholder: "👨‍🔧 ผู้เชี่ยวชาญของเรากำลังวิเคราะห์กรณีของคุณ...",
            default_placeholder: "อธิบายอาการเสีย แล้วทีมงานของเราจะแนะนำอู่ที่เหมาะสมให้",
            categories_label: "หมวดหมู่",
            clean_filters: "ล้างค่า",
            modal_title: "เลือกตำแหน่ง",
            modal_desc: "ป้อนเมืองหรือประเทศของคุณ (เช่น \"กรุงเทพ\", \"เชียงใหม่\")",
            country_label: "ประเทศ",
            country_placeholder: "เช่น ไทย...",
            state_label: "จังหวัด",
            state_placeholder: "เช่น ภูเก็ต...",
            city_label: "อำเภอ / เขต",
            city_placeholder: "เช่น จตุจักร...",
            cancel: "ยกเลิก",
            search: "ค้นหา",
            global_search_tip: "💡 เคล็ดลับ: คุณสามารถค้นหาเมืองใดก็ได้ในโลก"
        },
        business_details: {
            website: "เว็บไซต์",
            call: "โทร",
            about: "เกี่ยวกับธุรกิจ",
            location: "ตำแหน่ง",
            view_map: "ดูบนแผนที่",
            navigate_gps: "นำทาง GPS",
            hours: "เวลาทำการ",
            services: "🛠️ บริการที่มี",
            features: {
                "24_hours": "🕒 24 ชั่วโมง",
                "emergency": "🚑 ฉุกเฉิน",
                "home_service": "🏠 บริการถึงบ้าน"
            }
        },
        map_locator: {
            view_details: "ดูรายละเอียด",
            loading_3d: "กำลังโหลดแผนที่ 3D..."
        }
    },
    id: { // Indonesian
        map_store: {
            loading: "Memuat Peta...",
            loading_location: "Mendapatkan lokasi Anda...",
            location_required: "Lokasi Diperlukan",
            location_permission_msg: "MapStore memerlukan lokasi Anda untuk menampilkan bisnis otomotif terdekat",
            location_access_msg: "MapStore memerlukan akses ke lokasi Anda untuk menampilkan bisnis di dekat Anda.",
            allow_gps: "Izinkan GPS",
            manual_location: "Masukkan Lokasi Secara Manual",
            how_to_activate: "Cara mengaktifkan lokasi?",
            step_1: "Klik ikon lokasi di bilah alamat",
            step_2: "Pilih \"Izinkan\" saat browser meminta izin",
            step_3: "Klik \"Izinkan GPS\" lagi",
            manual_tip: "Atau Anda dapat memasukkan kota secara manual untuk melihat bisnis di area tersebut",
            publish_business: "Terbitkan Bisnis Saya",
            smart_search_label: "Apa masalahnya?",
            smart_search_placeholder: "Cth. Mobil saya mengeluarkan bunyi aneh saat mengerem...",
            ask_specialist: "Tanya Spesialis",
            analyzing: "Menganalisis...",
            filter_success: "✅ Siap, filter diaktifkan",
            diagnosis: "🤖 Diagnosis:",
            no_matches: "⚠️ Tidak ada kecocokan ditemukan. Cobalah lebih spesifik (cth. \"rem\", \"mesin\").",
            specialist_placeholder: "👨‍🔧 Spesialis kami sedang menganalisis kasus Anda...",
            default_placeholder: "Jelaskan kerusakan Anda dan tim kami akan merekomendasikan bengkel yang ideal.",
            categories_label: "Kategori",
            clean_filters: "Bersihkan",
            modal_title: "Pilih Lokasi",
            modal_desc: "Masukkan kota atau negara Anda (cth. \"Jakarta\", \"Surabaya\", \"Bali\").",
            country_label: "Negara",
            country_placeholder: "Cth. Indonesia...",
            state_label: "Provinsi",
            state_placeholder: "Cth. Jawa Barat...",
            city_label: "Kota / Kabupaten",
            city_placeholder: "Cth. Bandung...",
            cancel: "Batal",
            search: "Cari",
            global_search_tip: "💡 Tips: Anda dapat mencari kota mana saja di dunia."
        },
        business_details: {
            website: "Situs Web",
            call: "Telepon",
            about: "Tentang Bisnis",
            location: "Lokasi",
            view_map: "Lihat di Peta",
            navigate_gps: "Navigasi GPS",
            hours: "Jam Operasional",
            services: "🛠️ Layanan Ditawarkan",
            features: {
                "24_hours": "🕒 24 Jam",
                "emergency": "🚑 Darurat",
                "home_service": "🏠 Layanan Rumah"
            }
        },
        map_locator: {
            view_details: "Lihat Detail",
            loading_3d: "Memuat peta 3D..."
        }
    },
    he: { // Hebrew
        map_store: {
            loading: "טוען מפה...",
            loading_location: "מקבל את המיקום שלך...",
            location_required: "נדרש מיקום",
            location_permission_msg: "MapStore זקוק למיקום שלך כדי להראות לך עסקים בתחום הרכב בקרבת מקום",
            location_access_msg: "MapStore זקוק לגישה למיקום שלך כדי להציג עסקים בתחום הרכב בקרבתך.",
            allow_gps: "אפשר GPS",
            manual_location: "הזן מיקום ידנית",
            how_to_activate: "איך להפעיל מיקום?",
            step_1: "לחץ על סמל המיקום בשורת הכתובת",
            step_2: "בחר \"אפשר\" כאשר הדפדפן מבקש הרשאות",
            step_3: "לחץ שוב על \"אפשר GPS\"",
            manual_tip: "או שתוכל להזין ידנית את העיר שלך כדי לראות עסקים באזור זה",
            publish_business: "פרסם את העסק שלי",
            smart_search_label: "מה הבעיה?",
            smart_search_placeholder: "למשל, הרכב משמיע רעש מוזר בבלימה...",
            ask_specialist: "שאל את המומחה",
            analyzing: "מנתח...",
            filter_success: "✅ מוכן, מסננים הופעלו",
            diagnosis: "🤖 אבחון:",
            no_matches: "⚠️ לא נמצאו התאמות. נסה להיות ספציפי יותר (למשל \"בלמים\", \"מנוע\").",
            specialist_placeholder: "👨‍🔧 המומחים שלנו מנתחים את המקרה שלך...",
            default_placeholder: "תאר את התקלה והצוות שלנו ימליץ על המוסכים המתאימים.",
            categories_label: "קטגוריות",
            clean_filters: "נקה",
            modal_title: "בחר מיקום",
            modal_desc: "הזן את העיר או המדינה שלך (למשל \"תל אביב\", \"ירושלים\").",
            country_label: "מדינה",
            country_placeholder: "למשל ישראל...",
            state_label: "מחוז",
            state_placeholder: "למשל המרכז...",
            city_label: "עיר",
            city_placeholder: "למשל חולון...",
            cancel: "ביטול",
            search: "חפש",
            global_search_tip: "💡 טיפ: אתה יכול לחפש כל עיר בעולם."
        },
        business_details: {
            website: "אתר אינטרנט",
            call: "התקשר",
            about: "על העסק",
            location: "מיקום",
            view_map: "הצג במפה",
            navigate_gps: "ניווט GPS",
            hours: "שעות פתיחה",
            services: "🛠️ שירותים מוצעים",
            features: {
                "24_hours": "🕒 24 שעות",
                "emergency": "🚑 חירום",
                "home_service": "🏠 שירות עד הבית"
            }
        },
        map_locator: {
            view_details: "הצג פרטים",
            loading_3d: "טוען מפה תלת ממדית..."
        }
    },
    ur: { // Urdu
        map_store: {
            loading: "نقشہ لوڈ ہو رہا ہے...",
            loading_location: "آپ کا مقام حاصل کیا جا رہا ہے...",
            location_required: "مقام درکار ہے",
            location_permission_msg: "آس پاس کے آٹوموٹو کاروبار دکھانے کیلئے MapStore کو آپ کے مقام کی ضرورت ہے",
            location_access_msg: "MapStore کو آپ کے قریب کاروبار دکھانے کیلئے آپ کے مقام تک رسائی درکار ہے۔",
            allow_gps: "GPS کی اجازت دیں",
            manual_location: "دستی طور پر مقام درج کریں",
            how_to_activate: "مقام کیسے فعال کریں؟",
            step_1: "ایڈریس بار میں لوکیشن آئیکن پر کلک کریں",
            step_2: "براؤزر کی درخواست پر \"اجازت دیں\" منتخب کریں",
            step_3: "دوبارہ \"GPS کی اجازت دیں\" پر کلک کریں",
            manual_tip: "یا آپ اس علاقے میں کاروبار دیکھنے کیلئے اپنا شہر دستی طور پر درج کر سکتے ہیں",
            publish_business: "میرا کاروبار شائع کریں",
            smart_search_label: "کیا مسئلہ ہے؟",
            smart_search_placeholder: "مثلاً بریک لگاتے وقت میری گاڑی سے عجیب آواز آتی ہے...",
            ask_specialist: "ماہر سے پوچھیں",
            analyzing: "تجزیہ جاری ہے...",
            filter_success: "✅ تیار، فلٹرز فعال",
            diagnosis: "🤖 تشخیص:",
            no_matches: "⚠️ کوئی مماثلت نہیں ملی۔ کچھ خاص لکھیں (مثلاً \"بریک\"، \"انجن\")۔",
            specialist_placeholder: "👨‍🔧 ہمارے ماہرین آپ کے مسئلے کا تجزیہ کر رہے ہیں...",
            default_placeholder: "اپنی خرابی بیان کریں اور ہماری ٹیم مثالی ورکشاپس تجویز کرے گی۔",
            categories_label: "زمرہ جات",
            clean_filters: "صاف کریں",
            modal_title: "و مقام منتخب کریں",
            modal_desc: "اپنا شہر یا ملک درج کریں (مثلاً \"لاہور\"، \"کراچی\"، \"اسلام آباد\")۔",
            country_label: "ملک",
            country_placeholder: "مثلاً پاکستان...",
            state_label: "صوبہ",
            state_placeholder: "مثلاً پنجاب...",
            city_label: "شہر",
            city_placeholder: "مثلاً ملتان...",
            cancel: "منسوخ کریں",
            search: "تلاش کریں",
            global_search_tip: "💡 مشورہ: آپ دنیا کا کوئی بھی شہر تلاش کر سکتے ہیں۔"
        },
        business_details: {
            website: "ویب سائٹ",
            call: "کال کریں",
            about: "کاروبار کے بارے میں",
            location: "مقام",
            view_map: "نقشے پر دیکھیں",
            navigate_gps: "GPS نیویگیشن",
            hours: "کام کے اوقات",
            services: "🛠️ پیش کردہ خدمات",
            features: {
                "24_hours": "🕒 24 گھنٹے",
                "emergency": "🚑 ایمرجنسی",
                "home_service": "🏠 ہوم سروس"
            }
        },
        map_locator: {
            view_details: "تفصیلات دیکھیں",
            loading_3d: "3D نقشہ لوڈ ہو رہا ہے..."
        }
    }
};

fs.readdir(localesDir, (err, files) => {
    if (err) {
        console.error("Could not list locales directory:", err);
        return;
    }

    files.forEach(file => {
        if (!file.endsWith('.json')) return;
        const langCode = file.replace('.json', '');
        const filePath = path.join(localesDir, file);

        // Skip languages that were already handled manually or are not in our specific new update list
        // Actually, let's update ONLY the ones present in 'dictionary' to overwrite the English defaults we set earlier
        if (!dictionary[langCode]) {
            console.log(`Skipping ${langCode} (Manual/Up-to-date)`);
            return;
        }

        console.log(`Processing comprehensive translation for ${langCode}...`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);
            const newKeys = dictionary[langCode];

            // Merge logic
            json.map_store = newKeys.map_store;
            json.business_details = newKeys.business_details;
            json.map_locator = newKeys.map_locator;

            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Fully Translated ${langCode}`);
        } catch (e) {
            console.error(`❌ Error processing ${langCode}:`, e);
        }
    });

    console.log("Global comprehensive translation update complete!");
});
