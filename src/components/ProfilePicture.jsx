 import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Camera, Loader, User } from 'lucide-react'
import FullImageModal from './FullImageModal'
import { getCachedSettings } from '../services/settingsService'

export default function ProfilePicture({ 
    size = 'lg', 
    editable = false, 
    userId = null,
    onUpdate 
}) {
    const { user, profile, updateAvatar } = useAuth()
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [showFullImage, setShowFullImage] = useState(false)
    const fileInputRef = useRef(null)

    const isOwn = !userId || userId === user?.id
    const targetUserId = userId || user?.id

    const settings = getCachedSettings()
    const allowProfilePictures = settings?.allow_profile_pictures !== false

    useEffect(() => {
        if (targetUserId && targetUserId !== user?.id) {
            const fetchUserAvatar = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', targetUserId)
                    .single()
                if (data) setAvatarUrl(data.avatar_url)
            }
            fetchUserAvatar()
        } else if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url)
        }
    }, [targetUserId, user?.id, profile])

    const initials = profile?.username?.[0]?.toUpperCase() || 
                     user?.email?.[0]?.toUpperCase() || 'U'

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-20 h-20 text-2xl',
        xxl: 'w-32 h-32 text-4xl'
    }

    const sizeClass = sizeClasses[size] || sizeClasses.lg

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!allowProfilePictures) {
            alert('Profile pictures are currently disabled')
            return
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPEG, PNG, GIF)')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB')
            return
        }

        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result)
        reader.readAsDataURL(file)

        await uploadAvatar(file)
    }

    const uploadAvatar = async (file) => {
        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            const publicUrl = urlData.publicUrl
            await updateAvatar(publicUrl)
            setAvatarUrl(publicUrl)
            setPreview(null)
            if (onUpdate) onUpdate()

            alert('Profile picture updated successfully!')

        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Failed to upload image. Please try again.\nError: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const triggerFileInput = () => {
        if (editable && isOwn && !uploading && allowProfilePictures) {
            fileInputRef.current?.click()
        }
    }

    const handleAvatarClick = () => {
        if (avatarUrl || preview) {
            setShowFullImage(true)
        } else if (editable && isOwn) {
            triggerFileInput()
        }
    }

    const displayUrl = preview || avatarUrl

    return (
        <>
            <div className="relative inline-block">
                <div 
                    className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300 cursor-pointer hover:ring-2 hover:ring-gray-400 transition`}
                    onClick={handleAvatarClick}
                >
                    {displayUrl ? (
                        <img 
                            src={displayUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={() => setAvatarUrl(null)}
                        />
                    ) : (
                        <User className="text-gray-500" size={parseInt(sizeClass) * 0.6 || 20} />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader className="w-6 h-6 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {editable && isOwn && !uploading && allowProfilePictures && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            triggerFileInput()
                        }}
                        className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1.5 shadow-lg hover:bg-green-700 transition"
                        title="Change profile picture"
                    >
                        <Camera size={14} />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {showFullImage && displayUrl && (
                <FullImageModal
                    imageUrl={displayUrl}
                    onClose={() => setShowFullImage(false)}
                    username={profile?.username || user?.email?.split('@')[0]}
                />
            )}
        </>
    )
}