const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

// Dictionary of Native Translations for Critical Sections
// This script covers: Terms, Privacy, Publish (AI), Market (Empty states)
// Focusing on: JA, RU, DE, FR, PT, IT, ZH, KO, AR

const dictionaries = {
    ja: {
        terms: {
            title: "利用規約",
            last_updated: "最終更新",
            acceptance_title: "1. 規約の受諾",
            acceptance_text: "CarMatch（以下「本プラットフォーム」）をダウンロード、アクセス、または使用することにより、これらの利用規約に拘束されることに同意したことになります。",
            liability_title: "2. 責任の制限（重要）",
            liability_intro: "CarMatchは、デジタル仲介および技術サービスのプロバイダーとしてのみ機能します。",
            liability_1_title: "私たちは取引の当事者ではありません",
            liability_1_text: "CarMatchは、掲載された車両を購入、販売、または所有しません。売買契約は、購入者と販売者の間でのみ厳格に行われます。",
            liability_2_title: "車両を保証しません",
            liability_2_text: "車両の機械的、法的、または物理的な状態を検査または保証しません。説明は完全にユーザーによって提供されます。",
            liability_3_title: "交渉の免責事項",
            liability_3_text: "CarMatchは、ユーザー間の交渉や会合から生じる紛争、詐欺、不払い、または損害について責任を負いません。",
            liability_4_title: "安全のヒント",
            liability_4_text: "当社の「安全な待ち合わせ場所」の提案やAIアラートは情報提供のみを目的としており、絶対的な安全を保証するものではありません。",
            usage_title: "3. プラットフォームの使用",
            usage_text: "合法的な目的でのみCarMatchを使用することに同意します。虚偽、誤解を招くコンテンツ、または盗難車の投稿は禁止されています。",
            fees_title: "4. 手数料と支払い",
            fees_text: "車両の掲載には、現在のモデル（例：無料期間後の掲載クレジット）に従って手数料がかかる場合があります。",
            mapstore_title: "5. Map Storeとビジネス",
            mapstore_text: "「Map Store」に表示されるワークショップやビジネスに関する情報は参考情報です。",
            intellectual_title: "6. 知的財産",
            intellectual_text: "すべてのCarMatchコンテンツ、ブランド、ロゴ、ソフトウェアは、当社の所有者の独占的財産です。",
            contact_title: "7. お問い合わせ",
            contact_text: "これらの規約についてご質問がある場合は、アプリの公式サポートからお問い合わせください。"
        },
        publish: {
            ai: {
                magic_desc: "魔法のような説明を作成中...",
                success: "車両の分析に成功しました！",
                we_detected: "検出結果:",
                is_this_correct: "これで正しいですか？",
                analyzing: "専門家のレビューをリクエスト中...",
                detecting: "アドバイザーが写真を検証しています...",
                confidence: "承認率",
                upload_photo_first: "開始するには写真をアップロードしてください",
                error_not_vehicle: "当社のセキュリティチームは有効な車両を認識できませんでした。エンジン付き車両のみが許可されています。",
                security_check: "セキュリティチェック"
            }
        },
        privacy: {
            title: "プライバシーポリシー",
            intro_title: "1. はじめに",
            intro_text: "CarMatchでは、お客様のプライバシーを尊重します。このポリシーは、情報の収集、使用、保護の方法を説明します。",
            collect_title: "2. 私たちが収集する情報",
            collect_1_title: "登録データ",
            collect_1_text: "名前、メールアドレス、電話番号、暗号化されたパスワード。",
            collect_2_title: "車両情報",
            collect_2_text: "掲載する車両の詳細（ブランド、モデル、写真、状態）。これらは公開情報となります。",
            collect_3_title: "位置情報データ",
            collect_3_text: "「Map Store」や近くの車両を表示するために、位置情報（GPS）を使用します。",
            collect_4_title: "インタラクション",
            collect_4_text: "AIによる推奨を改善するために、CarMatchでの「いいね」と「嫌い」を記録します。",
            use_title: "3. 情報の使用",
            use_text: "私たちはあなたのデータを以下のために使用します：",
            use_1: "車両の売買を容易にするため。",
            use_2: "安全機能を提供するため。",
            use_3: "推奨アルゴリズムを改善するため。",
            use_4: "不正行為を防止するため。",
            share_title: "4. 情報の共有",
            share_bold: "私たちはあなたの個人データを第三者に販売しません。",
            share_text: "以下の場合にのみ情報を共有します：",
            share_1: "他のユーザーと連絡を取るか、車両を公開する場合。",
            share_2: "法律により要求された場合、法的当局と。",
            security_title: "5. データセキュリティ",
            security_text: "データを保護するために堅牢なセキュリティ対策を実施していますが、100%確実なシステムはありません。",
            rights_title: "6. あなたの権利",
            rights_text: "あなたは自分の個人情報にアクセス、修正、または削除する権利を持っています。"
        },
        market: {
            cant_find_title: "理想の車が見つかりませんか？",
            cant_find_desc: "探している間に、あなたの車を売ることができます！",
            publish_cta: "私の車を掲載する",
            search_placeholder: "理想の車両を見つける...",
            search_btn: "検索",
            searching: "近くの車両を検索中..."
        }
    },
    de: {
        terms: {
            liability_1_text: "CarMatch kauft, verkauft oder besitzt die gelisteten Fahrzeuge nicht. Kaufverträge bestehen ausschließlich zwischen Käufer und Verkäufer.",
            acceptance_text: "Durch das Herunterladen, Zugreifen oder Verwenden von CarMatch stimmen Sie diesen Geschäftsbedingungen zu.",
            liability_4_text: "Unsere Vorschläge für 'Sichere Treffpunkte' sind nur informativ und garantieren keine absolute Sicherheit."
        },
        publish: {
            ai: {
                magic_desc: "Erstelle magische Beschreibung...",
                success: "Fahrzeug erfolgreich analysiert!",
                we_detected: "Wir haben erkannt:",
                security_check: "Sicherheitsüberprüfung",
                error_not_vehicle: "Unser Sicherheitsteam erkennt kein gültiges Fahrzeug. Nur motorisierte Fahrzeuge sind erlaubt."
            }
        },
        market: {
            cant_find_title: "Finden Sie nicht das perfekte Auto?",
            cant_find_desc: "Während Sie suchen, können Sie Ihres verkaufen!",
            publish_cta: "Mein Fahrzeug veröffentlichen"
        }
    },
    fr: {
        terms: {
            acceptance_text: "En téléchargeant, accédant ou utilisant CarMatch, vous acceptez d'être lié par ces Termes et Conditions.",
            liability_1_text: "CarMatch n'achète, ne vend ni ne possède les véhicules listés. Tout contrat d'achat est strictement entre l'Acheteur et le Vendeur.",
            liability_4_text: "Nos suggestions de 'Points de Rencontre Sécurisés' sont uniquement informatives."
        },
        publish: {
            ai: {
                magic_desc: "Création d'une description magique...",
                success: "Véhicule analysé avec succès !",
                we_detected: "Nous avons détecté :",
                security_check: "Contrôle de sécurité",
                error_not_vehicle: "Notre équipe de sécurité ne reconnaît pas de véhicule valide."
            }
        },
        market: {
            cant_find_title: "Vous ne trouvez pas la voiture parfaite ?",
            cant_find_desc: "Pendant que vous cherchez, vous pouvez vendre la vôtre !",
            publish_cta: "Publier mon véhicule"
        }
    },
    pt: {
        terms: {
            acceptance_text: "Ao baixar, acessar ou usar o CarMatch, você concorda em ficar vinculado a estes Termos e Condições.",
            liability_1_text: "O CarMatch não compra, vende ou possui os veículos listados. Qualquer contrato de compra e venda é estritamente entre o Comprador e o Vendedor.",
            liability_4_text: "Nossas sugestões de 'Pontos de Encontro Seguros' são apenas informativas."
        },
        publish: {
            ai: {
                magic_desc: "Criando descrição mágica...",
                success: "Veículo analisado com sucesso!",
                we_detected: "Detectamos:",
                security_check: "Verificação de Segurança",
                error_not_vehicle: "Nossa equipe de segurança não reconhece um veículo válido."
            }
        },
        market: {
            cant_find_title: "Não encontra o carro perfeito?",
            cant_find_desc: "Enquanto procura, pode vender o seu!",
            publish_cta: "Publicar meu veículo"
        }
    },
    it: {
        terms: {
            acceptance_text: "Scaricando, accedendo o utilizzando CarMatch, accetti di essere vincolato da questi Termini e Condizioni.",
            liability_1_text: "CarMatch non compra, vende o possiede i veicoli elencati. Qualsiasi contratto di acquisto è rigorosamente tra l'Acquirente e il Venditore.",
            liability_4_text: "I nostri suggerimenti sui 'Punti di Incontro Sicuri' sono solo informativi."
        },
        publish: {
            ai: {
                magic_desc: "Creazione descrizione magica...",
                success: "Veicolo analizzato con successo!",
                we_detected: "Abbiamo rilevato:",
                security_check: "Controllo di Sicurezza",
                error_not_vehicle: "Il nostro team di sicurezza non riconosce un veicolo valido."
            }
        },
        market: {
            cant_find_title: "Non trovi l'auto perfetta?",
            cant_find_desc: "Mentre cerchi, puoi vendere la tua!",
            publish_cta: "Pubblica il mio veicolo"
        }
    },
    ru: {
        terms: {
            acceptance_text: "Скачивая, получая доступ или используя CarMatch, вы соглашаетесь с настоящими Условиями использования.",
            liability_1_text: "CarMatch не покупает, не продает и не владеет перечисленными автомобилями. Любой договор купли-продажи заключается строго между Покупателем и Продавцом.",
            liability_4_text: "Наши предложения «Безопасных мест встречи» носят исключительно информационный характер."
        },
        publish: {
            ai: {
                magic_desc: "Создание волшебного описания...",
                success: "Автомобиль успешно проанализирован!",
                we_detected: "Мы обнаружили:",
                security_check: "Проверка безопасности",
                error_not_vehicle: "Наша служба безопасности не распознает допустимое транспортное средство."
            }
        },
        market: {
            cant_find_title: "Не можете найти идеальный автомобиль?",
            cant_find_desc: "Пока ищете, вы можете продать свой!",
            publish_cta: "Опубликовать мой автомобиль"
        }
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
            else if (dict.terms) json.terms = dict.terms;

            // Publish/AI
            if (dict.publish && dict.publish.ai && json.publish) {
                if (!json.publish.ai) json.publish.ai = {};
                Object.assign(json.publish.ai, dict.publish.ai);
            }

            // Privacy
            if (dict.privacy && json.privacy) Object.assign(json.privacy, dict.privacy);
            else if (dict.privacy) json.privacy = dict.privacy;

            // Market
            if (dict.market && json.market) Object.assign(json.market, dict.market);

            fs.writeFileSync(filePath, JSON.stringify(json, null, 4));
            console.log(`✅ Patched Global Content for ${lang}`);
        } catch (e) {
            console.error(`❌ Error patching ${lang}:`, e.message);
        }
    }
});
