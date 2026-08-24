 import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../contexts/TranslationContext'
import { 
  LogOut, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  ChevronRight,
  Sun,
  Lock,
  HelpCircle,
  Smartphone,
  ChevronLeft,
  UserCircle,
  FileText,
  Scale
} from 'lucide-react'

export default function Settings() {
    const { user, profile, signOut } = useAuth()
    const { t, language } = useTranslation()
    const navigate = useNavigate()

    console.log('Current language in Settings:', language)

    const handleSignOut = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            await signOut()
            navigate('/login')
        }
    }

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { 
                    icon: UserCircle, 
                    label: t('edit_profile'), 
                    onClick: () => navigate('/profile'),
                    description: profile?.full_name || profile?.username || 'Set up your profile'
                },
                { 
                    icon: Bell, 
                    label: t('notifications'), 
                    onClick: () => navigate('/notifications'),
                    description: 'Manage your notifications'
                },
                { 
                    icon: Lock, 
                    label: t('privacy'), 
                    onClick: () => {},
                    description: 'Control your privacy settings'
                },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { 
                    icon: Sun, 
                    label: t('appearance'), 
                    onClick: () => navigate('/settings/appearance'),
                    description: 'Light / Dark mode'
                },
                { 
                    icon: Globe, 
                    label: t('language'), 
                    onClick: () => navigate('/settings/language'),
                    description: 'Change your language'
                },
            ]
        },
        {
            title: 'Legal & Support',
            items: [
                { 
                    icon: FileText, 
                    label: 'Privacy Policy', 
                    onClick: () => navigate('/privacy'),
                    description: 'Read our privacy policy'
                },
                { 
                    icon: Scale, 
                    label: 'Terms of Service', 
                    onClick: () => navigate('/terms'),
                    description: 'Read our terms and conditions'
                },
                { 
                    icon: HelpCircle, 
                    label: t('help_feedback'), 
                    onClick: () => {},
                    description: 'Get help or send feedback'
                },
                { 
                    icon: Smartphone, 
                    label: t('app_version'), 
                    onClick: () => {},
                    description: 'v1.0.0'
                },
            ]
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {t('settings') || 'Settings'}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 flex items-center gap-4 transition-colors duration-200">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-lg">
                    {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{profile?.full_name || profile?.username || 'User'}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{user?.email}</p>
                </div>
                <button 
                    onClick={() => navigate('/profile')}
                    className="ml-auto text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    Edit
                </button>
            </div>

            {settingsSections.map((section) => (
                <div key={section.title} className="mb-6">
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                        {section.title}
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                        {section.items.map((item, index) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={index}
                                    onClick={item.onClick}
                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                                        index !== section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                            <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                                            {item.description && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400 dark:text-gray-600" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 transition-colors duration-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.predictions_count || 0}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Predictions</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.points || 0}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Points</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{profile?.accuracy || 0}%</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Accuracy</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition"
            >
                <LogOut size={18} />
                Sign Out
            </button>

            <div className="text-center mt-6">
                <p className="text-xs text-gray-400 dark:text-gray-500">PredictFC v1.0.0</p>
            </div>
        </div>
    )
}