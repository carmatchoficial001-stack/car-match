"use client"

import { useLanguage } from "@/contexts/LanguageContext"

export default function TermsPage() {
    const { t } = useLanguage()

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('terms.title')}</h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">{t('terms.last_updated')}: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-800 dark:text-gray-300">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.acceptance_title')}</h2>
                    <p>{t('terms.acceptance_text')}</p>
                </section>

                <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                    <h2 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">{t('terms.liability_title')}</h2>
                    <p className="font-medium mb-2">{t('terms.liability_intro')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>{t('terms.liability_1_title')}:</strong> {t('terms.liability_1_text')}</li>
                        <li><strong>{t('terms.liability_2_title')}:</strong> {t('terms.liability_2_text')}</li>
                        <li><strong>{t('terms.liability_3_title')}:</strong> {t('terms.liability_3_text')}</li>
                        <li><strong>{t('terms.liability_4_title')}:</strong> {t('terms.liability_4_text')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.usage_title')}</h2>
                    <p>{t('terms.usage_text')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.fees_title')}</h2>
                    <p>{t('terms.fees_text')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.mapstore_title')}</h2>
                    <p>{t('terms.mapstore_text')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.intellectual_title')}</h2>
                    <p>{t('terms.intellectual_text')}</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-primary">{t('terms.contact_title')}</h2>
                    <p>{t('terms.contact_text')}</p>
                </section>
            </div>
        </div>
    )
}
