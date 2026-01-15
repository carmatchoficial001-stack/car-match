"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import Header from "@/components/Header"

export default function TermsPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background pb-32">
            <Header />
            <div className="container mx-auto px-4 pt-8 pb-32 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                    {t('terms.title')}
                </h1>

                <div className="prose prose-invert max-w-none space-y-8">
                    <p className="mb-4 text-gray-600 dark:text-gray-400 font-mono text-sm border-b border-gray-200 dark:border-gray-800 pb-2">
                        {t('terms.last_updated')}: {new Date().toLocaleDateString()}
                    </p>

                    <div className="space-y-10 text-gray-800 dark:text-gray-300">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-primary border-l-4 border-primary pl-4">
                                {t('terms.acceptance_title')}
                            </h2>
                            <p className="leading-relaxed text-justify">{t('terms.acceptance_text')}</p>
                        </section>

                        <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-lg border-2 border-red-100 dark:border-red-900/30">
                            <h2 className="text-2xl font-black mb-4 text-red-700 dark:text-red-500 flex items-center gap-2">
                                ⚖️ {t('terms.liability_title')}
                            </h2>
                            <p className="font-bold mb-6 text-red-800 dark:text-red-400 text-lg">{t('terms.liability_intro')}</p>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 pb-4 border-b border-red-100 dark:border-red-900/20 md:border-b-0">
                                    <h3 className="font-bold text-red-900 dark:text-red-200 uppercase text-sm tracking-wider">{t('terms.liability_1_title')}</h3>
                                    <p className="text-sm opacity-90">{t('terms.liability_1_text')}</p>
                                </div>
                                <div className="space-y-2 pb-4 border-b border-red-100 dark:border-red-900/20 md:border-b-0">
                                    <h3 className="font-bold text-red-900 dark:text-red-200 uppercase text-sm tracking-wider">{t('terms.liability_2_title')}</h3>
                                    <p className="text-sm opacity-90">{t('terms.liability_2_text')}</p>
                                </div>
                                <div className="space-y-2 pb-4 border-b border-red-100 dark:border-red-900/20 md:border-b-0">
                                    <h3 className="font-bold text-red-900 dark:text-red-200 uppercase text-sm tracking-wider">{t('terms.liability_3_title')}</h3>
                                    <p className="text-sm opacity-90">{t('terms.liability_3_text')}</p>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-red-900 dark:text-red-200 uppercase text-sm tracking-wider">{t('terms.liability_4_title')}</h3>
                                    <p className="text-sm opacity-90">{t('terms.liability_4_text')}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-gray-50 dark:bg-gray-900/30 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
                            <h2 className="text-2xl font-semibold mb-4 text-primary">
                                {t('terms.usage_title')}
                            </h2>
                            <p className="leading-relaxed whitespace-pre-wrap">{t('terms.usage_text')}</p>
                        </section>

                        <section className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-400 flex items-center gap-2">
                                💳 {t('terms.fees_title')}
                            </h2>
                            <p className="leading-relaxed font-medium text-blue-900 dark:text-blue-200 uppercase text-xs tracking-widest mb-2">Aviso de No Reembolso</p>
                            <p className=" leading-relaxed">{t('terms.fees_text')}</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-primary">
                                {t('terms.mapstore_title')}
                            </h2>
                            <p className="leading-relaxed">{t('terms.mapstore_text')}</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4 text-primary">
                                {t('terms.intellectual_title')}
                            </h2>
                            <p className="leading-relaxed">{t('terms.intellectual_text')}</p>
                        </section>

                        <section className="pt-8 border-t border-gray-200 dark:border-gray-800">
                            <h2 className="text-2xl font-semibold mb-4 text-primary">
                                {t('terms.contact_title')}
                            </h2>
                            <p className="leading-relaxed italic">{t('terms.contact_text')}</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
