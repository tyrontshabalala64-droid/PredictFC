import { useState, useEffect } from 'react'
import { getPlatformSettings } from '../services/settingsService'

export function useSettings() {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const data = await getPlatformSettings()
            setSettings(data)
            setError(null)
        } catch (err) {
            console.error('Error loading settings:', err)
            setError(err)
            // Set default settings if error
            setSettings({
                max_post_length: 5000,
                max_images_per_post: 5,
                max_comment_length: 1000,
                allow_post_editing: true,
                allow_post_deletion: true,
                allow_comments: true,
                community_creation_enabled: true,
                max_communities_per_user: 10,
                default_community_price: 50,
                allow_profile_pictures: true,
                allow_phone_numbers: true,
                show_online_status: true
            })
        } finally {
            setLoading(false)
        }
    }

    return { settings, loading, error, reload: loadSettings }
}