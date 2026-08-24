 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function FollowButton({ userId, username, onFollowChange }) {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [followersCount, setFollowersCount] = useState(0)

    useEffect(() => {
        if (userId) {
            checkFollowStatus()
            getFollowersCount()
        }
    }, [userId, user])

    const checkFollowStatus = async () => {
        if (!user || userId === user.id) return
        
        try {
            const { data, error } = await supabase
                .from('followers')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', userId)
                .maybeSingle()
            
            setIsFollowing(!!data)
        } catch (error) {
            console.error('Error checking follow status:', error)
            setIsFollowing(false)
        }
    }

    const getFollowersCount = async () => {
        try {
            const { count } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId)
            
            setFollowersCount(count || 0)
        } catch (error) {
            console.error('Error getting followers count:', error)
        }
    }

    const handleFollow = async () => {
        if (!user) {
            showToast('Please sign in to follow users', 'warning')
            return
        }

        if (userId === user.id) {
            showToast('You cannot follow yourself', 'info')
            return
        }

        setLoading(true)

        try {
            // Check if user has a profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            if (!profileData) {
                await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: user.email?.split('@')[0] || 'user',
                        full_name: user.email?.split('@')[0] || 'user'
                    })
            }

            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('followers')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', userId)
                
                if (error) throw error
                
                setIsFollowing(false)
                setFollowersCount(prev => prev - 1)
                showToast(`Unfollowed ${username || 'user'}`, 'info')
            } else {
                // Follow
                const { error } = await supabase
                    .from('followers')
                    .insert({
                        follower_id: user.id,
                        following_id: userId
                    })
                
                if (error) throw error
                
                setIsFollowing(true)
                setFollowersCount(prev => prev + 1)
                showToast(`Now following ${username || 'user'}!`, 'success')

                // ✅ Create a follow notification
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        from_user_id: user.id,
                        type: 'follow',
                        message: `${profile?.full_name || profile?.username || 'Someone'} started following you`
                    })
            }

            if (onFollowChange) onFollowChange()
        } catch (error) {
            console.error('Follow error:', error)
            showToast('Failed to follow/unfollow user', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Don't show follow button for own profile
    if (!user || userId === user.id) return null

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleFollow}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
            >
                {loading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
            </button>
            <span className="text-sm text-gray-500">{followersCount} followers</span>
        </div>
    )
}