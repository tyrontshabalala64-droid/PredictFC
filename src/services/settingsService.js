 import { supabase } from '../lib/supabase'

let cachedSettings = null
let cacheTime = 0
const CACHE_DURATION = 60000 // 1 minute

export async function getPlatformSettings() {
    if (cachedSettings && (Date.now() - cacheTime) < CACHE_DURATION) {
        return cachedSettings
    }

    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .limit(1)
            .maybeSingle()

        if (error) {
            console.warn('Error loading settings:', error)
            return getDefaultSettings()
        }

        if (data) {
            cachedSettings = data
            cacheTime = Date.now()
            return data
        }

        return getDefaultSettings()
    } catch (error) {
        console.error('Error fetching settings:', error)
        return getDefaultSettings()
    }
}

function getDefaultSettings() {
    return {
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
    }
}

// ✅ Add this function - it's missing!
export function getCachedSettings() {
    return cachedSettings
}

export async function isMaintenanceMode() {
    const settings = await getPlatformSettings()
    return settings.maintenance_mode === true
}

export async function isRegistrationAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_registration === true
}

export async function isCommunityCreationAllowed() {
    const settings = await getPlatformSettings()
    return settings.community_creation_enabled === true
}

export async function getMaxPostLength() {
    const settings = await getPlatformSettings()
    return settings.max_post_length || 5000
}

export async function getMaxImagesPerPost() {
    const settings = await getPlatformSettings()
    return settings.max_images_per_post || 5
}

export async function getMaxCommentLength() {
    const settings = await getPlatformSettings()
    return settings.max_comment_length || 1000
}

export async function isPostEditingAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_post_editing !== false
}

export async function isPostDeletionAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_post_deletion !== false
}

export async function areCommentsAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_comments !== false
}

export async function getCommentModeration() {
    const settings = await getPlatformSettings()
    return settings.comment_moderation || 'none'
}

export async function isAutoModerationEnabled() {
    const settings = await getPlatformSettings()
    return settings.auto_moderation_enabled === true
}

export async function getMaxCommunitiesPerUser() {
    const settings = await getPlatformSettings()
    return settings.max_communities_per_user || 10
}

export async function getDefaultCommunityPrice() {
    const settings = await getPlatformSettings()
    return settings.default_community_price || 50
}

export async function areProfilePicturesAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_profile_pictures !== false
}

export async function arePhoneNumbersAllowed() {
    const settings = await getPlatformSettings()
    return settings.allow_phone_numbers !== false
}

export async function showOnlineStatus() {
    const settings = await getPlatformSettings()
    return settings.show_online_status !== false
}

export function clearSettingsCache() {
    cachedSettings = null
    cacheTime = 0
}