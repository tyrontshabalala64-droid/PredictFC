 import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function Appearance() {
    const navigate = useNavigate()
    const { theme, setTheme } = useTheme()

    const themes = [
        {
            id: 'light',
            icon: Sun,
            label: 'Light',
            description: 'Use light theme',
            bgColor: 'bg-white',
            textColor: 'text-gray-800'
        },
        {
            id: 'dark',
            icon: Moon,
            label: 'Dark',
            description: 'Use dark theme',
            bgColor: 'bg-gray-900',
            textColor: 'text-white'
        },
        {
            id: 'system',
            icon: Monitor,
            label: 'System',
            description: 'Follow system preference',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800'
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pb-20 transition-colors duration-200">
            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Appearance</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose how the app looks</p>
                </div>
                
                {/* Theme Preview */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-3">
                        {themes.map((option) => {
                            const isSelected = theme === option.id
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setTheme(option.id)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        isSelected 
                                            ? 'border-gray-800 dark:border-white' 
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className={`${option.bgColor} rounded-lg p-4 mb-2 transition-colors duration-200`}>
                                        <div className="flex items-center justify-between">
                                            <div className={`w-8 h-8 rounded-full ${option.id === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                                                <option.icon size={16} className={option.id === 'dark' ? 'text-white' : 'text-gray-600'} />
                                            </div>
                                            <div className={`w-12 h-6 rounded-full ${option.id === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 rounded-full bg-white transform transition-all ${option.id === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1">
                                            <div className={`h-2 rounded ${option.id === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                                            <div className={`h-2 rounded w-3/4 ${option.id === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-medium ${isSelected ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{option.description}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="flex justify-center mt-1">
                                            <Check size={16} className="text-green-600 dark:text-green-400" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Changes will apply instantly. Your preference is saved locally.
                </p>
            </div>
        </div>
    )
}