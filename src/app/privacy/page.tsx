"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import Header from '@/components/Header'

export default function PrivacyPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background pb-32">
            <Header />
            <div className="container mx-auto px-4 pt-8 pb-8 max-w-4xl text-text-primary">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('privacy.title')}</h1>

                <div className="prose prose-invert max-w-none space-y-8">
                    <p className="opacity-80 text-gray-600 dark:text-gray-400">
                        {t('privacy.last_updated')}: {new Date().toLocaleDateString()}
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-primary">{t('privacy.intro_title')}</h2>
                        <p className="text-gray-800 dark:text-gray-300 leading-relaxed">{t('privacy.intro_text')}</p>
                    </section>

                    <section className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                        <h2 className="text-2xl font-bold mb-4 text-primary">{t('privacy.collect_title')}</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('privacy.collect_1_title')}</h3>
                                <p className="text-gray-800 dark:text-gray-300">{t('privacy.collect_1_text')}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('privacy.collect_2_title')}</h3>
                                <p className="text-gray-800 dark:text-gray-300">{t('privacy.collect_2_text')}</p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('privacy.collect_3_title')}</h3>
                                <p className="text-gray-800 dark:text-gray-300 font-medium">{t('privacy.collect_3_text')}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('privacy.collect_4_title')}</h3>
                                <p className="text-gray-800 dark:text-gray-300">{t('privacy.collect_4_text')}</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-primary">{t('privacy.use_title')}</h2>
                        <p className="mb-4 text-gray-800 dark:text-gray-300">{t('privacy.use_text')}</p>
                        <ul className="list-disc pl-6 space-y-3 text-gray-800 dark:text-gray-300">
                            <li>{t('privacy.use_1')}</li>
                            <li>{t('privacy.use_2')}</li>
                            <li>{t('privacy.use_3')}</li>
                            <li className="font-bold text-red-600 dark:text-red-400">{t('privacy.use_4')}</li>
                        </ul>
                    </section>

                    <section className="border-t border-gray-200 dark:border-gray-800 pt-6">
                        <h2 className="text-2xl font-semibold mb-3 text-primary">{t('privacy.share_title')}</h2>
                        <p className="mb-4 font-bold text-gray-900 dark:text-white uppercase text-sm tracking-widest">{t('privacy.share_bold')}</p>
                        <p className="mb-2 text-gray-800 dark:text-gray-300">{t('privacy.share_text')}</p>
                        <ul className="list-disc pl-6 space-y-4 text-gray-800 dark:text-gray-300">
                            <li>{t('privacy.share_1')}</li>
                            <li className="p-3 bg-red-50 dark:bg-red-900/10 rounded">
                                <span className="font-bold text-red-700 dark:text-red-400">{t('privacy.share_2')}</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-primary">{t('privacy.security_title')}</h2>
                        <p className="text-gray-800 dark:text-gray-300 leading-relaxed italic opacity-90">{t('privacy.security_text')}</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold mb-3 text-primary">{t('privacy.rights_title')}</h2>
                        <p className="text-gray-800 dark:text-gray-300">{t('privacy.rights_text')}</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
