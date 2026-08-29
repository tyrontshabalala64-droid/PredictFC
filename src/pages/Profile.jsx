 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Heart, 
  Building2, 
  DollarSign,
  FileText,
  Users,
  UserPlus,
  CheckCircle,
  Plus,
  Phone,
  Settings as SettingsIcon,
  MessageCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import FollowButton from '../components/follow/FollowButton'
import ProfilePicture from '../components/ProfilePicture'
import BouncingLoader from '../components/BouncingLoader'

export default function Profile() {
    const { userId } = useParams()
    const { user, profile: currentUserProfile } = useAuth()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [myCommunities, setMyCommunities] = useState([])
    const [createdCommunities, setCreatedCommunities] = useState([])
    const [myPredictions, setMyPredictions] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0
    })
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [warningCount, setWarningCount] = useState(0)

    const targetUserId = userId || user?.id
    const isOwn = targetUserId === user?.id

    useEffect(() => {
        if (targetUserId) {
            loadProfileData(targetUserId)
        }
    }, [targetUserId, user])

    const loadProfileData = async (targetId) => {
        setLoading(true)
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)

            const { data: memberData } = await supabase
                .from('community_members')
                .select(`
                    community_id,
                    communities (*)
                `)
                .eq('user_id', targetId)
                .eq('status', 'active')

            const communities = memberData?.map(m => m.communities).filter(c => c !== null) || []
            setMyCommunities(communities)

            const { data: createdData } = await supabase
                .from('communities')
                .select('*')
                .eq('creator_id', targetId)
            setCreatedCommunities(createdData || [])

            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', targetId)
                .order('created_at', { ascending: false })
                .limit(10)
            setMyPredictions(postsData || [])

            const { data: posts } = await supabase
                .from('posts')
                .select('likes_count')
                .eq('user_id', targetId)

            const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0
            setStats({
                totalPosts: posts?.length || 0,
                totalLikes: totalLikes,
                totalComments: 0
            })

            const { count: followers } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', targetId)
            setFollowersCount(followers || 0)

            const { count: following } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', targetId)
            setFollowingCount(following || 0)

            const { count: warnings } = await supabase
                .from('warnings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', targetId)
                .eq('status', 'active')
            setWarningCount(warnings || 0)

        } catch (error) {
            console.error('Error loading profile data:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleMessage = () => {
        navigate(`/inbox?user=${targetUserId}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <BouncingLoader size="xl" color="green" text="Loading profile..." />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">User not found</p>
                <Link to="/" className="text-green-600 hover:underline mt-4 block">Go Home</Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 pb-20">
            {/* ===== PROFILE HEADER ===== */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0">
                        <ProfilePicture size="xl" editable={isOwn} userId={targetUserId} onUpdate={() => loadProfileData(targetUserId)} />
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white break-words">
                                {profile?.full_name || profile?.username || 'User'}
                            </h1>
                            {profile?.is_verified && <VerifiedBadge size="lg" showTooltip />}
                            {warningCount > 0 && (
                                <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
                                    <AlertTriangle size={12} /> {warningCount}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm break-all">@{profile?.username || 'username'}</p>
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs sm:text-sm">
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <Mail size={14} className="flex-shrink-0" /> 
                                <span className="break-all">{profile?.email || 'No email'}</span>
                            </span>
                            <span className="text-gray-400 dark:text-gray-600">•</span>
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1 whitespace-nowrap">
                                <Calendar size={14} className="flex-shrink-0" /> Joined {formatDate(profile?.created_at)}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                            <Link to={`/profile/${profile.id}/followers`} className="text-sm hover:text-green-600 dark:hover:text-green-400 transition flex items-center gap-1">
                                <Users size={14} className="flex-shrink-0" /> 
                                <span className="font-bold text-gray-800 dark:text-white">{followersCount}</span> 
                                <span className="text-gray-500 dark:text-gray-400">Followers</span>
                            </Link>
                            <Link to={`/profile/${profile.id}/following`} className="text-sm hover:text-green-600 dark:hover:text-green-400 transition flex items-center gap-1">
                                <UserPlus size={14} className="flex-shrink-0" /> 
                                <span className="font-bold text-gray-800 dark:text-white">{followingCount}</span> 
                                <span className="text-gray-500 dark:text-gray-400">Following</span>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
                        {isOwn && (
                            <Link 
                                to="/community/create"
                                className="bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition text-sm text-center flex items-center justify-center gap-1 flex-1 sm:flex-none"
                            >
                                <Plus size={16} /> Create
                            </Link>
                        )}
                        {!isOwn && (
                            <>
                                <FollowButton 
                                    userId={profile.id} 
                                    username={profile.username}
                                    onFollowChange={() => loadProfileData(profile.id)}
                                    variant="profile"
                                />
                                <button
                                    onClick={handleMessage}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"
                                >
                                    <MessageCircle size={16} />
                                    Message
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{profile?.points || 0}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <Trophy size={12} className="sm:size-14" /> Points
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{profile?.predictions_count || 0}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <BarChart3 size={12} className="sm:size-14" /> Preds
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{stats.totalLikes}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <Heart size={12} className="sm:size-14" /> Likes
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{myCommunities.length + createdCommunities.length}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <Building2 size={12} className="sm:size-14" /> Groups
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <AlertTriangle size={12} className="sm:size-14" /> Warns
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== TABS ===== */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                        activeTab === 'overview' 
                            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    <BarChart3 size={14} className="sm:size-16" /> Overview
                </button>
                <button
                    onClick={() => setActiveTab('communities')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                        activeTab === 'communities' 
                            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    <Building2 size={14} className="sm:size-16" /> Groups ({myCommunities.length + createdCommunities.length})
                </button>
                <button
                    onClick={() => setActiveTab('predictions')}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                        activeTab === 'predictions' 
                            ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    <FileText size={14} className="sm:size-16" /> Posts ({stats.totalPosts})
                </button>
                {isOwn && (
                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center gap-1 sm:gap-2 ${
                            activeTab === 'earnings' 
                                ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        <DollarSign size={14} className="sm:size-16" /> Earnings
                    </button>
                )}
            </div>

            {/* ===== TAB CONTENT ===== */}
            <div className="space-y-4">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {createdCommunities.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
                                    <Building2 size={16} /> Created Groups
                                </h3>
                                <div className="space-y-2">
                                    {createdCommunities.slice(0, 3).map(community => (
                                        <Link 
                                            key={community.id}
                                            to={`/community/${community.id}`}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium text-gray-800 dark:text-white text-sm truncate block">{community.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {community.member_count || 0} members
                                                </span>
                                            </div>
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 flex-shrink-0 ml-2">
                                                <CheckCircle size={12} /> Admin
                                            </span>
                                        </Link>
                                    ))}
                                    {createdCommunities.length > 3 && (
                                        <button 
                                            onClick={() => setActiveTab('communities')}
                                            className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 mt-1"
                                        >
                                            View all {createdCommunities.length} <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {myCommunities.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
                                    <Users size={16} /> Joined Groups
                                </h3>
                                <div className="space-y-2">
                                    {myCommunities.slice(0, 3).map(community => (
                                        <Link 
                                            key={community.id}
                                            to={`/community/${community.id}`}
                                            className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                        >
                                            <span className="font-medium text-gray-800 dark:text-white text-sm">{community.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                {community.member_count || 0} members
                                            </span>
                                        </Link>
                                    ))}
                                    {myCommunities.length > 3 && (
                                        <button 
                                            onClick={() => setActiveTab('communities')}
                                            className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 mt-1"
                                        >
                                            View all {myCommunities.length} <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {createdCommunities.length === 0 && myCommunities.length === 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center">
                                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No communities yet</p>
                                {isOwn && (
                                    <Link 
                                        to="/community/create"
                                        className="inline-block mt-4 bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 text-sm"
                                    >
                                        Create Your First Community
                                    </Link>
                                )}
                            </div>
                        )}

                        {isOwn && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <Link 
                                    to="/settings"
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
                                        <SettingsIcon size={16} /> Settings
                                    </span>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </Link>
                            </div>
                        )}
                    </>
                )}

                {/* Communities Tab */}
                {activeTab === 'communities' && (
                    <div className="space-y-4">
                        {createdCommunities.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
                                    <Building2 size={16} /> Created Groups ({createdCommunities.length})
                                </h3>
                                <div className="space-y-2">
                                    {createdCommunities.map(community => (
                                        <Link 
                                            key={community.id}
                                            to={`/community/${community.id}`}
                                            className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition border border-yellow-200 dark:border-yellow-800"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium text-gray-800 dark:text-white text-sm truncate block">{community.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {community.member_count || 0} members
                                                </span>
                                            </div>
                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 flex-shrink-0 ml-2">
                                                <CheckCircle size={12} /> Admin
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {myCommunities.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
                                    <Users size={16} /> Joined Groups ({myCommunities.length})
                                </h3>
                                <div className="space-y-2">
                                    {myCommunities.map(community => (
                                        <Link 
                                            key={community.id}
                                            to={`/community/${community.id}`}
                                            className="block p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                        >
                                            <span className="font-medium text-gray-800 dark:text-white text-sm">{community.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                {community.member_count || 0} members
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {createdCommunities.length === 0 && myCommunities.length === 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center">
                                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">You haven't joined any communities yet</p>
                                {isOwn && (
                                    <Link 
                                        to="/community"
                                        className="inline-block mt-4 bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 text-sm"
                                    >
                                        Discover Communities
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Predictions Tab */}
                {activeTab === 'predictions' && (
                    <div>
                        {myPredictions.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center">
                                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No posts yet</p>
                                {isOwn && (
                                    <Link 
                                        to="/matches"
                                        className="inline-block mt-4 bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 text-sm"
                                    >
                                        Share Your First Prediction
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myPredictions.map(post => (
                                    <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-gray-800 dark:text-white text-sm break-words">{post.text?.substring(0, 100)}</p>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                                                    <span className="text-red-500 flex items-center gap-1">
                                                        <Heart size={12} /> {post.likes_count || 0}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                        <Calendar size={12} /> {formatDate(post.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link 
                                                to="/feed"
                                                className="text-xs text-green-600 dark:text-green-400 hover:underline flex-shrink-0"
                                            >
                                                View →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Earnings Tab */}
                {isOwn && activeTab === 'earnings' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-base">
                            <DollarSign size={20} /> Earnings
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                <div className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                                    R{createdCommunities.reduce((sum, c) => sum + ((c.member_count || 0) * (c.price || 50) * 0.5), 0).toFixed(2)}
                                </div>
                                <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Total Earnings</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                                <div className="text-xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {createdCommunities.length}
                                </div>
                                <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Groups Created</div>
                            </div>
                        </div>

                        {createdCommunities.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Community Earnings</h4>
                                <div className="space-y-2">
                                    {createdCommunities.map(community => (
                                        <div key={community.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium text-gray-800 dark:text-white text-sm truncate block">{community.name}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {community.payment_type || 'monthly'} · R{community.price || 50}
                                                </span>
                                            </div>
                                            <span className="text-green-600 dark:text-green-400 font-bold text-sm flex-shrink-0 ml-2">
                                                R{((community.member_count || 0) * (community.price || 50) * 0.5).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {createdCommunities.length === 0 && (
                            <div className="text-center py-6">
                                <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Create a community to start earning</p>
                                <Link 
                                    to="/community/create"
                                    className="inline-block mt-3 bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 text-sm"
                                >
                                    Create Community
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}