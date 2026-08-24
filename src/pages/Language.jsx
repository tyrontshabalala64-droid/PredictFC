 import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, Globe, Languages, ChevronRight, Search } from 'lucide-react'
import { useTranslation } from '../contexts/TranslationContext'  // Change this import

export default function Language() {
    const navigate = useNavigate()
    const { language, setLanguage, t } = useTranslation()  // Use the context
    const [searchQuery, setSearchQuery] = useState('')

    const languages = [
        // South African Languages (11 official)
        { 
            id: 'zu', 
            name: 'isiZulu', 
            nativeName: 'isiZulu',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Sawubona'
        },
        { 
            id: 'xh', 
            name: 'isiXhosa', 
            nativeName: 'isiXhosa',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Molo'
        },
        { 
            id: 'af', 
            name: 'Afrikaans', 
            nativeName: 'Afrikaans',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Hallo'
        },
        { 
            id: 'nso', 
            name: 'Sepedi', 
            nativeName: 'Sepedi',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Thobela'
        },
        { 
            id: 'tn', 
            name: 'Setswana', 
            nativeName: 'Setswana',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Dumela'
        },
        { 
            id: 'st', 
            name: 'Sesotho', 
            nativeName: 'Sesotho',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Lumela'
        },
        { 
            id: 'ts', 
            name: 'Xitsonga', 
            nativeName: 'Xitsonga',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Avuxeni'
        },
        { 
            id: 'ss', 
            name: 'siSwati', 
            nativeName: 'siSwati',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Sawubona'
        },
        { 
            id: 've', 
            name: 'Tshivenda', 
            nativeName: 'Tshivenda',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Ndi matsheloni'
        },
        { 
            id: 'nr', 
            name: 'isiNdebele', 
            nativeName: 'isiNdebele',
            region: '🇿🇦',
            category: 'South African',
            greeting: 'Salibonani'
        },
        { 
            id: 'en', 
            name: 'English', 
            nativeName: 'English',
            region: '🇬🇧',
            category: 'South African',
            greeting: 'Welcome'
        },
        // International Languages
        { 
            id: 'es', 
            name: 'Spanish', 
            nativeName: 'Español',
            region: '🇪🇸',
            category: 'International',
            greeting: 'Bienvenido'
        },
        { 
            id: 'fr', 
            name: 'French', 
            nativeName: 'Français',
            region: '🇫🇷',
            category: 'International',
            greeting: 'Bienvenue'
        },
        { 
            id: 'de', 
            name: 'German', 
            nativeName: 'Deutsch',
            region: '🇩🇪',
            category: 'International',
            greeting: 'Willkommen'
        },
        { 
            id: 'pt', 
            name: 'Portuguese', 
            nativeName: 'Português',
            region: '🇵🇹',
            category: 'International',
            greeting: 'Bem-vindo'
        },
        { 
            id: 'it', 
            name: 'Italian', 
            nativeName: 'Italiano',
            region: '🇮🇹',
            category: 'International',
            greeting: 'Benvenuto'
        },
        { 
            id: 'nl', 
            name: 'Dutch', 
            nativeName: 'Nederlands',
            region: '🇳🇱',
            category: 'International',
            greeting: 'Welkom'
        }
    ]

    const filteredLanguages = languages.filter(lang => 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const saLanguages = filteredLanguages.filter(l => l.category === 'South African')
    const internationalLanguages = filteredLanguages.filter(l => l.category === 'International')

    const handleLanguageSelect = (langId) => {
        setLanguage(langId)  // This will update the app language
    }

    const getSelectedGreeting = () => {
        const selected = languages.find(l => l.id === language)
        return selected?.greeting || 'Welcome'
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pb-20 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {t('language') || 'Language'}
                </h1>
            </div>

            {/* Current Language Display */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 flex items-center justify-between transition-colors duration-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">
                        {languages.find(l => l.id === language)?.region || '🌍'}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Language</p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                            {languages.find(l => l.id === language)?.name || 'English'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {getSelectedGreeting()} 👋
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full px-4 py-3 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 text-gray-800 dark:text-white transition-colors duration-200"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* South African Languages Section */}
            {saLanguages.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-6 bg-green-600 dark:bg-green-400 rounded-full"></div>
                        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            South African Languages
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                {saLanguages.length} languages
                            </span>
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                        {saLanguages.map((lang, index) => {
                            const isSelected = language === lang.id
                            return (
                                <button
                                    key={lang.id}
                                    onClick={() => handleLanguageSelect(lang.id)}
                                    className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                                        isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isSelected 
                                                ? 'bg-green-600 dark:bg-green-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                            <span className="text-lg">{lang.region}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-medium text-gray-800 dark:text-white">{lang.name}</span>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{lang.nativeName}</p>
                                            {isSelected && (
                                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                                                    ✓ Selected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isSelected ? (
                                            <Check size={20} className="text-green-600 dark:text-green-400" />
                                        ) : (
                                            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* International Languages Section */}
            {internationalLanguages.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            International Languages
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {internationalLanguages.length} languages
                            </span>
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                        {internationalLanguages.map((lang, index) => {
                            const isSelected = language === lang.id
                            return (
                                <button
                                    key={lang.id}
                                    onClick={() => handleLanguageSelect(lang.id)}
                                    className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isSelected 
                                                ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                            <span className="text-lg">{lang.region}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-medium text-gray-800 dark:text-white">{lang.name}</span>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{lang.nativeName}</p>
                                            {isSelected && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                                                    ✓ Selected
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isSelected ? (
                                            <Check size={20} className="text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {filteredLanguages.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <Languages size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No languages found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Try a different search term</p>
                </div>
            )}

            {/* Language Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-center transition-colors duration-200">
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">11</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">South African Languages</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 text-center transition-colors duration-200">
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">6</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">International Languages</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                    <Globe size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                            Language Support Status
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            🇿🇦 All 11 South African official languages are supported!
                            {language === 'zu' && ' 🔥 Sawubona!'}
                            {language === 'xh' && ' 🔥 Molo!'}
                            {language === 'af' && ' 🔥 Hallo!'}
                            {language === 'nso' && ' 🔥 Thobela!'}
                            {language === 'tn' && ' 🔥 Dumela!'}
                            {language === 'st' && ' 🔥 Lumela!'}
                            {language === 'ts' && ' 🔥 Avuxeni!'}
                            {language === 'ss' && ' 🔥 Sawubona!'}
                            {language === 've' && ' 🔥 Ndi matsheloni!'}
                            {language === 'nr' && ' 🔥 Salibonani!'}
                            {language === 'en' && ' 🇬🇧 Hello!'}
                        </p>
                        <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">
                            Select a language to switch the app interface
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}