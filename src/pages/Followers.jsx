 import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FollowButton from '../components/follow/FollowButton'
import { Users, UserPlus, ArrowLeft, Loader, ChevronLeft } from 'lucide-react'

export default function Followers() {
    const { userId, type } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)

    // Determine the actual type and userId from params and URL
    const getActualParams = () => {
        let actualType = type
        let actualUserId = userId
        
        // If type is undefined, try to extract it from the path
        if (!actualType) {
            const pathParts = location.pathname.split('/')
            const lastPart = pathParts[pathParts.length - 1]
            if (lastPart === 'followers' || lastPart === 'following') {
                actualType = lastPart
                if (pathParts.length >= 3) {
                    actualUserId = pathParts[pathParts.length - 2]
                }
            }
        }
        
        // If still no userId, use current user
        const targetId = actualUserId || user?.id
        
        return { targetId, actualType }
    }

    useEffect(() => {
        const { targetId, actualType } = getActualParams()
        
        if (!targetId) {
            setError('No user specified. Please log in or navigate to a valid profile.')
            setLoading(false)
            return
        }

        if (!actualType) {
            setError('Invalid URL. Must end with "followers" or "following"')
            setLoading(false)
            return
        }

        if (actualType !== 'followers' && actualType !== 'following') {
            setError('Invalid type (must be "followers" or "following")')
            setLoading(false)
            return
        }

        loadData(targetId, actualType)
    }, [userId, type, location.pathname, user])

    const loadData = async (targetId, targetType) => {
        setLoading(true)
        setError(null)
        
        try {
            // Get user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, email')
                .eq('id', targetId)
                .single()

            if (profileError) {
                console.error('Profile error:', profileError)
                throw profileError
            }
            setProfile(profileData)

            // Get followers or following
            let query
            if (targetType === 'followers') {
                // Users who follow this person
                query = supabase
                    .from('followers')
                    .select(`
                        follower_id,
                        profiles:follower_id (
                            id,
                            username,
                            full_name,
                            avatar_url,
                            is_verified,
                            email
                        )
                    `)
                    .eq('following_id', targetId)
            } else if (targetType === 'following') {
                // Users this person follows
                query = supabase
                    .from('followers')
                    .select(`
                        following_id,
                        profiles:following_id (
                            id,
                            username,
                            full_name,
                            avatar_url,
                            is_verified,
                            email
                        )
                    `)
                    .eq('follower_id', targetId)
            } else {
                throw new Error('Invalid type: ' + targetType)
            }

            const { data, error } = await query

            if (error) {
                console.error('Query error:', error)
                throw error
            }

            // Extract users from the nested structure
            let userList = []
            if (data && data.length > 0) {
                userList = data
                    .map(item => {
                        if (targetType === 'followers') {
                            return item.profiles
                        } else {
                            return item.profiles
                        }
                    })
                    .filter(profile => profile !== null && profile !== undefined)
            }

            setUsers(userList)

        } catch (error) {
            console.error('Error loading data:', error)
            setError(error.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // Handle loading state
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                    <Loader className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
                </div>
            </div>
        )
    }

    // Handle error state
    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                        <p className="font-medium">Error loading data</p>
                        <p className="text-sm">{error}</p>
                        <div className="flex gap-3 mt-3">
                            <button 
                                onClick={() => navigate(-1)}
                                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
                            >
                                Go Back
                            </button>
                            <button 
                                onClick={() => {
                                    const { targetId, actualType } = getActualParams()
                                    if (targetId && actualType) {
                                        loadData(targetId, actualType)
                                    }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Handle no profile found
    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">User not found</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        )
    }

    // Determine display type
    const displayType = type || (location.pathname.includes('followers') ? 'followers' : 'following')

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
                <div className="flex items-center gap-3">
                    <Link 
                        to={`/profile/${profile.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {displayType === 'followers' ? (
                                <Users size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            ) : (
                                <UserPlus size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            )}
                            <span className="truncate">
                                {displayType === 'followers' ? 'Followers' : 'Following'}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{profile?.username || 'user'}
                        </p>
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {users.length} {displayType === 'followers' ? 'followers' : 'following'}
                    </div>
                </div>
            </div>

            {/* Users List */}
            {users.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-4xl mb-4">👀</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {displayType === 'followers' 
                            ? 'No followers yet' 
                            : 'Not following anyone yet'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {displayType === 'followers' 
                            ? 'When people follow you, they\'ll appear here' 
                            : 'Follow other users to see them here'}
                    </p>
                    {displayType === 'following' && user?.id === profile?.id && (
                        <Link 
                            to="/community"
                            className="inline-block mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                        >
                            Find people to follow
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {users.map((userItem) => (
                        <div 
                            key={userItem.id} 
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between hover:shadow-md transition"
                        >
                            <Link 
                                to={`/profile/${userItem.id}`} 
                                className="flex items-center gap-3 hover:opacity-80 flex-1 min-w-0"
                            >
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm overflow-hidden flex-shrink-0">
                                    {userItem.avatar_url ? (
                                        <img 
                                            src={userItem.avatar_url} 
                                            alt={userItem.username} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        userItem.username?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-800 dark:text-white flex items-center gap-1.5 truncate">
                                        {userItem.full_name || userItem.username}
                                        {userItem.is_verified && (
                                            <span className="text-blue-500 text-sm font-bold flex-shrink-0">✓</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">@{userItem.username}</div>
                                </div>
                            </Link>
                            {userItem.id !== user?.id && (
                                <div className="flex-shrink-0 ml-2">
                                    <FollowButton 
                                        userId={userItem.id} 
                                        username={userItem.username}
                                        onFollowChange={() => {
                                            const { targetId, actualType } = getActualParams()
                                            if (targetId && actualType) {
                                                loadData(targetId, actualType)
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}