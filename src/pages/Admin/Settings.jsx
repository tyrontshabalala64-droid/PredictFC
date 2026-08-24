 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { clearSettingsCache } from '../../services/settingsService'
import { 
  Settings as SettingsIcon, 
  Save,
  RefreshCw,
  Globe,
  Users,
  Shield,
  Bell,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

export default function PlatformSettings() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        app_name: 'PredictFC',
        app_tagline: 'Predict matches and earn points',
        maintenance_mode: false,
        allow_registration: true,
        require_email_verification: true,
        min_password_length: 6,
        max_communities_per_user: 10,
        community_creation_enabled: true,
        default_community_price: 50,
        allow_post_editing: true,
        allow_post_deletion: true,
        max_post_length: 5000,
        max_images_per_post: 5,
        allow_comments: true,
        comment_moderation: 'none',
        max_comment_length: 1000,
        push_notifications_enabled: true,
        email_notifications_enabled: true,
        auto_moderation_enabled: false,
        report_handling: 'manual',
        max_reports_before_action: 3,
        show_online_status: true,
        allow_profile_pictures: true,
        allow_phone_numbers: true
    })
    const [settingsId, setSettingsId] = useState(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*')
                .limit(1)
                .maybeSingle()

            if (error) {
                console.warn('No settings table yet, using defaults:', error)
                setLoading(false)
                return
            }

            if (data) {
                setSettingsId(data.id)
                const updatedSettings = { ...settings }
                Object.keys(data).forEach(key => {
                    if (key in updatedSettings) {
                        updatedSettings[key] = data[key]
                    }
                })
                setSettings(updatedSettings)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { id, ...settingsToSave } = settings
            
            const dataToUpsert = {
                ...settingsToSave,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            }

            let result
            if (settingsId) {
                const { data, error } = await supabase
                    .from('platform_settings')
                    .update(dataToUpsert)
                    .eq('id', settingsId)
                    .select()
                    .single()

                if (error) throw error
                result = data
            } else {
                const { data, error } = await supabase
                    .from('platform_settings')
                    .insert(dataToUpsert)
                    .select()
                    .single()

                if (error) throw error
                result = data
                setSettingsId(result.id)
            }

            // ✅ Clear the cache so changes take effect immediately
            clearSettingsCache()

            showToast('Settings saved successfully! Changes are now active.', 'success')
        } catch (error) {
            console.error('Error saving settings:', error)
            showToast('Failed to save settings: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const toggleSetting = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const renderToggle = (key, label, description) => {
        const value = settings[key]
        return (
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
                    {description && <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>}
                </div>
                <button
                    onClick={() => toggleSetting(key)}
                    className={`relative w-12 h-6 rounded-full transition ${value ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-200 transition ${value ? 'right-1' : 'left-1'}`} />
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Loading settings...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <SettingsIcon size={24} /> Platform Settings
                    </h1>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Configure your platform settings and preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Maintenance Mode Warning Banner */}
            {settings.maintenance_mode && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Maintenance Mode is ON</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Regular users will see a maintenance page. Only admins can access the app.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* General */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Globe size={16} /> General Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label>
                            <input
                                type="text"
                                value={settings.app_name}
                                onChange={(e) => updateSetting('app_name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Tagline</label>
                            <input
                                type="text"
                                value={settings.app_tagline}
                                onChange={(e) => updateSetting('app_tagline', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                        {renderToggle('maintenance_mode', 'Maintenance Mode', 'Put the app in maintenance mode (only admins can access)')}
                    </div>
                </div>

                {/* Registration */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Users size={16} /> Registration Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('allow_registration', 'Allow Registration', 'Allow new users to create accounts')}
                        {renderToggle('require_email_verification', 'Require Email Verification', 'Users must verify their email before accessing the app')}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Password Length</label>
                            <input
                                type="number"
                                min="6"
                                max="20"
                                value={settings.min_password_length}
                                onChange={(e) => updateSetting('min_password_length', parseInt(e.target.value) || 6)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Communities */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Users size={16} /> Community Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('community_creation_enabled', 'Community Creation', 'Allow users to create communities')}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Communities Per User</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={settings.max_communities_per_user}
                                onChange={(e) => updateSetting('max_communities_per_user', parseInt(e.target.value) || 10)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Community Price (ZAR)</label>
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                value={settings.default_community_price}
                                onChange={(e) => updateSetting('default_community_price', parseFloat(e.target.value) || 50)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Posts */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Shield size={16} /> Post Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('allow_post_editing', 'Allow Post Editing', 'Users can edit their own posts')}
                        {renderToggle('allow_post_deletion', 'Allow Post Deletion', 'Users can delete their own posts')}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Post Length</label>
                            <input
                                type="number"
                                min="100"
                                max="50000"
                                value={settings.max_post_length}
                                onChange={(e) => updateSetting('max_post_length', parseInt(e.target.value) || 5000)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Images Per Post</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={settings.max_images_per_post}
                                onChange={(e) => updateSetting('max_images_per_post', parseInt(e.target.value) || 5)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Comments */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Mail size={16} /> Comment Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('allow_comments', 'Allow Comments', 'Enable comments on posts')}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment Moderation</label>
                            <select
                                value={settings.comment_moderation}
                                onChange={(e) => updateSetting('comment_moderation', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            >
                                <option value="none">None (all comments published immediately)</option>
                                <option value="manual">Manual (admins must approve)</option>
                                <option value="auto">Auto (spam detection)</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Comment Length</label>
                            <input
                                type="number"
                                min="50"
                                max="5000"
                                value={settings.max_comment_length}
                                onChange={(e) => updateSetting('max_comment_length', parseInt(e.target.value) || 1000)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Bell size={16} /> Notification Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('push_notifications_enabled', 'Push Notifications', 'Enable push notifications for users')}
                        {renderToggle('email_notifications_enabled', 'Email Notifications', 'Enable email notifications for users')}
                    </div>
                </div>

                {/* Moderation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Lock size={16} /> Moderation Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('auto_moderation_enabled', 'Auto Moderation', 'Automatically flag suspicious content')}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Handling</label>
                            <select
                                value={settings.report_handling}
                                onChange={(e) => updateSetting('report_handling', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            >
                                <option value="manual">Manual (admins review each report)</option>
                                <option value="auto">Auto (auto-hide after threshold)</option>
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Reports Before Action</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={settings.max_reports_before_action}
                                onChange={(e) => updateSetting('max_reports_before_action', parseInt(e.target.value) || 3)}
                                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Lock size={16} /> Privacy Settings
                        </h3>
                    </div>
                    <div className="p-4">
                        {renderToggle('show_online_status', 'Show Online Status', 'Display when users are online')}
                        {renderToggle('allow_profile_pictures', 'Allow Profile Pictures', 'Users can upload profile pictures')}
                        {renderToggle('allow_phone_numbers', 'Allow Phone Numbers', 'Users can add phone numbers to their profile')}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Changes take effect immediately</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Some settings may require a page refresh to take effect.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}