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
  AlertTriangle
} from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import FollowButton from '../components/follow/FollowButton'
import ProfilePicture from '../components/ProfilePicture'

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
            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)

            // Get communities user is a member of
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

            // Get communities user created
            const { data: createdData } = await supabase
                .from('communities')
                .select('*')
                .eq('creator_id', targetId)
            setCreatedCommunities(createdData || [])

            // Get user's posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', targetId)
                .order('created_at', { ascending: false })
                .limit(10)
            setMyPredictions(postsData || [])

            // Get stats
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

            // Get followers count
            const { count: followers } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', targetId)
            setFollowersCount(followers || 0)

            // Get following count
            const { count: following } = await supabase
                .from('followers')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', targetId)
            setFollowingCount(following || 0)

            // Get warning count
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
            <div className="text-center py-12">
                <div className="text-gray-500">Loading profile...</div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">User not found</p>
                <Link to="/" className="text-green-600 hover:underline mt-4 block">Go Home</Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center gap-6">
                    <ProfilePicture size="xl" editable={isOwn} userId={targetUserId} onUpdate={() => loadProfileData(targetUserId)} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-gray-800">
                                {profile?.full_name || profile?.username || 'User'}
                            </h1>
                            {profile?.is_verified && <VerifiedBadge size="lg" showTooltip />}
                            {warningCount > 0 && (
                                <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                    <AlertTriangle size={12} /> {warningCount} Warning{warningCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500">@{profile?.username || 'username'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                            <span className="text-gray-600 flex items-center gap-1"><Mail size={14} /> {profile?.email || user?.email}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 flex items-center gap-1"><Calendar size={14} /> Joined {formatDate(profile?.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <Link to={`/profile/${profile.id}/followers`} className="text-sm hover:text-green-600 transition flex items-center gap-1">
                                <Users size={14} /> <span className="font-bold text-gray-800">{followersCount}</span> Followers
                            </Link>
                            <Link to={`/profile/${profile.id}/following`} className="text-sm hover:text-green-600 transition flex items-center gap-1">
                                <UserPlus size={14} /> <span className="font-bold text-gray-800">{followingCount}</span> Following
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {isOwn && (
                            <Link 
                                to="/community/create"
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm text-center flex items-center gap-1"
                            >
                                <Plus size={16} /> Create Community
                            </Link>
                        )}
                        {!isOwn && (
                            <div className="flex flex-col gap-2">
                                <FollowButton 
                                    userId={profile.id} 
                                    username={profile.username}
                                    onFollowChange={() => loadProfileData(profile.id)}
                                />
                                <button
                                    onClick={handleMessage}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={16} />
                                    Message
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{profile?.points || 0}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1"><Trophy size={14} /> Points</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{profile?.predictions_count || 0}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1"><BarChart3 size={14} /> Predictions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{stats.totalLikes}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1"><Heart size={14} /> Total Likes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{myCommunities.length + createdCommunities.length}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1"><Building2 size={14} /> Communities</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1"><AlertTriangle size={14} /> Warnings</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'overview' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <BarChart3 size={16} /> Overview
                </button>
                <button
                    onClick={() => setActiveTab('communities')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'communities' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <Building2 size={16} /> Communities ({myCommunities.length + createdCommunities.length})
                </button>
                <button
                    onClick={() => setActiveTab('predictions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'predictions' 
                            ? 'bg-gray-800 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <FileText size={16} /> My Posts ({stats.totalPosts})
                </button>
                {isOwn && (
                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
                            activeTab === 'earnings' 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        <DollarSign size={16} /> Earnings
                    </button>
                )}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {createdCommunities.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Building2 size={16} /> Communities I Created
                            </h3>
                            <div className="space-y-2">
                                {createdCommunities.map(community => (
                                    <Link 
                                        key={community.id}
                                        to={`/community/${community.id}`}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <div>
                                            <span className="font-medium">{community.name}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                {community.member_count || 0} members
                                            </span>
                                        </div>
                                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle size={14} /> Admin
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {myCommunities.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Users size={16} /> Communities I've Joined
                            </h3>
                            <div className="space-y-2">
                                {myCommunities.map(community => (
                                    <Link 
                                        key={community.id}
                                        to={`/community/${community.id}`}
                                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <span className="font-medium">{community.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {community.member_count || 0} members
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {createdCommunities.length === 0 && myCommunities.length === 0 && (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No communities yet</p>
                            {isOwn && (
                                <Link 
                                    to="/community/create"
                                    className="inline-block mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                                >
                                    Create Your First Community
                                </Link>
                            )}
                        </div>
                    )}

                    {isOwn && (
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <SettingsIcon size={16} /> Settings
                                </h3>
                                <Link 
                                    to="/settings"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <SettingsIcon size={20} />
                                    <span>Go to Settings</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
                <div className="space-y-4">
                    {createdCommunities.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Building2 size={16} /> Communities I Created
                            </h3>
                            <div className="space-y-2">
                                {createdCommunities.map(community => (
                                    <Link 
                                        key={community.id}
                                        to={`/community/${community.id}`}
                                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition border border-yellow-200"
                                    >
                                        <div>
                                            <span className="font-medium">{community.name}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                {community.member_count || 0} members
                                            </span>
                                        </div>
                                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle size={14} /> Admin
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {myCommunities.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md p-4">
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Users size={16} /> Communities I've Joined
                            </h3>
                            <div className="space-y-2">
                                {myCommunities.map(community => (
                                    <Link 
                                        key={community.id}
                                        to={`/community/${community.id}`}
                                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <span className="font-medium">{community.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            {community.member_count || 0} members
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {createdCommunities.length === 0 && myCommunities.length === 0 && (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">You haven't joined any communities yet</p>
                            {isOwn && (
                                <Link 
                                    to="/community"
                                    className="inline-block mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
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
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">You haven't shared any predictions yet</p>
                            <Link 
                                to="/matches"
                                className="inline-block mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                            >
                                Share Your First Prediction
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myPredictions.map(post => (
                                <div key={post.id} className="bg-white rounded-xl shadow-md p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-800">{post.text?.substring(0, 100)}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="text-red-500 flex items-center gap-1"><Heart size={14} /> {post.likes_count || 0}</span>
                                                <span className="text-gray-400"><Calendar size={14} /> {formatDate(post.created_at)}</span>
                                            </div>
                                        </div>
                                        <Link 
                                            to="/feed"
                                            className="text-sm text-green-600 hover:underline"
                                        >
                                            View
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
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign size={20} /> Earnings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">
                                R{createdCommunities.reduce((sum, c) => sum + ((c.member_count || 0) * (c.price || 50) * 0.5), 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">Total Earnings</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-yellow-600">
                                {createdCommunities.length}
                            </div>
                            <div className="text-sm text-gray-500">Communities Created</div>
                        </div>
                    </div>

                    {createdCommunities.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-700 mb-3">Community Earnings</h4>
                            <div className="space-y-2">
                                {createdCommunities.map(community => (
                                    <div key={community.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium">{community.name}</span>
                                            <span className="text-xs text-gray-400 ml-2">
                                                ({community.payment_type || 'monthly'} · R{community.price || 50})
                                            </span>
                                        </div>
                                        <span className="text-green-600 font-bold">
                                            R{((community.member_count || 0) * (community.price || 50) * 0.5).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {createdCommunities.length === 0 && (
                        <div className="text-center py-8">
                            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Create a community to start earning</p>
                            <Link 
                                to="/community/create"
                                className="inline-block mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                            >
                                Create Community
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}