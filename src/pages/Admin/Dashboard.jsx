 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Shield, 
  Users, 
  Building2, 
  FileText, 
  CheckCircle,
  XCircle,
  Flag,
  BarChart3,
  Ban,
  Check,
  Trash2,
  RefreshCw,
  CreditCard,
  Megaphone,
  Settings,
  ExternalLink,
  User,
  AlertTriangle,
  Eye,
  MessageCircle
} from 'lucide-react'

import Subscriptions from './Subscriptions'
import Analytics from './Analytics'
import Announcements from './Announcements'
import PlatformSettings from './Settings'

export default function AdminDashboard() {
    const { user, isAdmin, signOut } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCommunities: 0,
        totalPosts: 0,
        totalPredictions: 0,
        totalReports: 0
    })
    const [users, setUsers] = useState([])
    const [communities, setCommunities] = useState([])
    const [posts, setPosts] = useState([])
    const [reports, setReports] = useState([])
    const [reportLoading, setReportLoading] = useState(false)

    useEffect(() => {
        if (!isAdmin) {
            navigate('/')
            showToast('Access denied. Admin privileges required.', 'error')
        }
    }, [isAdmin, navigate, showToast])

    useEffect(() => {
        if (isAdmin) {
            loadDashboardData()
        }
    }, [isAdmin])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const [
                { count: userCount },
                { count: communityCount },
                { count: postCount },
                { count: predictionCount },
                { count: reportCount }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('communities').select('*', { count: 'exact', head: true }),
                supabase.from('posts').select('*', { count: 'exact', head: true }),
                supabase.from('public_predictions').select('*', { count: 'exact', head: true }),
                supabase.from('reports').select('*', { count: 'exact', head: true })
            ])

            setStats({
                totalUsers: userCount || 0,
                totalCommunities: communityCount || 0,
                totalPosts: postCount || 0,
                totalPredictions: predictionCount || 0,
                totalReports: reportCount || 0
            })

            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, username, full_name, email, phone, role, created_at, is_banned, is_verified')
                .order('created_at', { ascending: false })
                .limit(20)
            setUsers(usersData || [])

            const { data: communitiesData } = await supabase
                .from('communities')
                .select('*, profiles:creator_id (username, full_name)')
                .order('created_at', { ascending: false })
                .limit(20)
            setCommunities(communitiesData || [])

            const { data: postsData } = await supabase
                .from('posts')
                .select('*, profiles:user_id (username, full_name)')
                .order('created_at', { ascending: false })
                .limit(20)
            setPosts(postsData || [])

            await loadReports()

        } catch (error) {
            console.error('Error loading dashboard:', error)
            showToast('Failed to load dashboard data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const loadReports = async () => {
        setReportLoading(true)
        
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error loading reports:', error)
                setReports([])
                setReportLoading(false)
                return
            }

            console.log('Reports loaded:', data)
            
            const reportsWithDetails = await Promise.all(
                (data || []).map(async (report) => {
                    const { data: reporterData } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, is_verified, is_banned')
                        .eq('id', report.reporter_id)
                        .single()
                    
                    const { data: targetUserData } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, is_verified, is_banned')
                        .eq('id', report.target_user_id)
                        .single()
                    
                    let postContent = null
                    if (report.target_type === 'post') {
                        const { data: postData } = await supabase
                            .from('posts')
                            .select('text, image, created_at, user_id')
                            .eq('id', report.target_id)
                            .single()
                        if (postData) {
                            postContent = postData
                        }
                    }
                    
                    return {
                        ...report,
                        reporter: reporterData,
                        targetUser: targetUserData,
                        postContent: postContent
                    }
                })
            )
            
            setReports(reportsWithDetails || [])
            
        } catch (error) {
            console.error('Exception loading reports:', error)
            setReports([])
        } finally {
            setReportLoading(false)
        }
    }

    // ---------- USER MANAGEMENT ----------
    const handleVerifyUser = async (userId) => {
        if (!window.confirm('Verify this user? They will get the blue verified badge.')) return
        
        try {
            await supabase
                .from('profiles')
                .update({ 
                    is_verified: true, 
                    verified_at: new Date().toISOString()
                })
                .eq('id', userId)
            
            showToast('User verified successfully!', 'success')
            loadDashboardData()
        } catch (error) {
            console.error('Error verifying user:', error)
            showToast('Failed to verify user', 'error')
        }
    }

    const handleUnverifyUser = async (userId) => {
        if (!window.confirm('Remove verification from this user?')) return
        
        try {
            await supabase
                .from('profiles')
                .update({ 
                    is_verified: false, 
                    verified_at: null
                })
                .eq('id', userId)
            
            showToast('Verification removed', 'success')
            loadDashboardData()
        } catch (error) {
            console.error('Error removing verification:', error)
            showToast('Failed to remove verification', 'error')
        }
    }

    const handleBanUser = async (userId, username) => {
        const reason = prompt(`Reason for banning @${username || 'this user'}:`)
        if (reason === null) return
        
        try {
            await supabase
                .from('profiles')
                .update({ 
                    is_banned: true, 
                    banned_at: new Date().toISOString(),
                    banned_reason: reason || 'Violation of terms'
                })
                .eq('id', userId)
            
            showToast(`User @${username || userId} banned successfully`, 'success')
            loadDashboardData()
            loadReports()
        } catch (error) {
            console.error('Error banning user:', error)
            showToast('Failed to ban user', 'error')
        }
    }

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Unban this user?')) return
        
        try {
            await supabase
                .from('profiles')
                .update({ is_banned: false, banned_at: null, banned_reason: null })
                .eq('id', userId)
            
            showToast('User unbanned successfully', 'success')
            loadDashboardData()
        } catch (error) {
            console.error('Error unbanning user:', error)
            showToast('Failed to unban user', 'error')
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Permanently delete this user? This cannot be undone.')) return
        
        try {
            await supabase.from('profiles').delete().eq('id', userId)
            showToast('User deleted successfully', 'success')
            loadDashboardData()
        } catch (error) {
            console.error('Error deleting user:', error)
            showToast('Failed to delete user: ' + error.message, 'error')
        }
    }

    // ---------- POST MANAGEMENT ----------
    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post and all associated data?')) return
        
        try {
            await supabase.from('post_reactions').delete().eq('post_id', postId)
            
            const { data: comments } = await supabase
                .from('post_comments')
                .select('id')
                .eq('post_id', postId)
            
            if (comments && comments.length > 0) {
                const commentIds = comments.map(c => c.id)
                await supabase.from('comment_replies').delete().in('comment_id', commentIds)
            }
            
            await supabase.from('post_comments').delete().eq('post_id', postId)
            
            const { error } = await supabase.from('posts').delete().eq('id', postId)
            if (error) throw error
            
            showToast('Post deleted successfully', 'success')
            loadDashboardData()
            loadReports()
        } catch (error) {
            console.error('Error deleting post:', error)
            showToast('Failed to delete post: ' + error.message, 'error')
        }
    }

    // ---------- COMMUNITY MANAGEMENT ----------
    const handleDeleteCommunity = async (communityId) => {
        if (!window.confirm('Delete this community and all associated data?')) return
        
        try {
            await supabase.from('communities').delete().eq('id', communityId)
            showToast('Community deleted successfully', 'success')
            loadDashboardData()
        } catch (error) {
            console.error('Error deleting community:', error)
            showToast('Failed to delete community: ' + error.message, 'error')
        }
    }

    // ---------- REPORT MANAGEMENT ----------
    const handleResolveReport = async (reportId) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ 
                    status: 'resolved', 
                    resolved_at: new Date().toISOString(),
                    resolved_by: user.id
                })
                .eq('id', reportId)
            
            if (error) throw error
            
            showToast('Report resolved successfully', 'success')
            loadReports()
            loadDashboardData()
        } catch (error) {
            console.error('Error resolving report:', error)
            showToast('Failed to resolve report: ' + error.message, 'error')
        }
    }

    const handleDismissReport = async (reportId) => {
        if (!window.confirm('Dismiss this report?')) return
        
        try {
            const { error } = await supabase
                .from('reports')
                .update({ 
                    status: 'dismissed', 
                    resolved_at: new Date().toISOString(),
                    resolved_by: user.id
                })
                .eq('id', reportId)
            
            if (error) throw error
            
            showToast('Report dismissed', 'success')
            loadReports()
            loadDashboardData()
        } catch (error) {
            console.error('Error dismissing report:', error)
            showToast('Failed to dismiss report: ' + error.message, 'error')
        }
    }

    // ---------- WARNING SYSTEM ----------
    const handleWarnUser = async (report) => {
        const targetUserId = report.target_user_id
        const username = report.targetUser?.username || 'user'
        const reason = prompt(`Enter warning reason for @${username}:`)
        
        if (reason === null) return
        if (!reason.trim()) {
            showToast('Warning reason is required', 'error')
            return
        }

        try {
            // 1. Create warning record
            const { data: warningData, error: warningError } = await supabase
                .from('warnings')
                .insert({
                    user_id: targetUserId,
                    warned_by: user.id,
                    reason: reason.trim(),
                    report_id: report.id,
                    status: 'active',
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single()

            if (warningError) throw warningError

            // 2. Create notification for the user
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: targetUserId,
                    from_user_id: user.id,
                    type: 'warning',
                    message: `You have received a warning: ${reason.trim()}`,
                    read: false
                })

            if (notifError) throw notifError

            // 3. Resolve the report
            await handleResolveReport(report.id)

            showToast(`Warning sent to @${username}`, 'info')
            loadReports()
            loadDashboardData()

        } catch (error) {
            console.error('Error sending warning:', error)
            showToast('Failed to send warning: ' + error.message, 'error')
        }
    }

    // ---------- ACTION ON REPORT ----------
    const handleActionOnReport = async (report, action) => {
        if (action === 'ban_user') {
            const targetUserId = report.target_user_id
            const username = report.targetUser?.username || 'user'
            await handleBanUser(targetUserId, username)
            await handleResolveReport(report.id)
        } else if (action === 'delete_post') {
            await handleDeletePost(report.target_id)
            await handleResolveReport(report.id)
        } else if (action === 'warn_user') {
            await handleWarnUser(report)
        } else if (action === 'resolve') {
            await handleResolveReport(report.id)
        } else if (action === 'dismiss') {
            await handleDismissReport(report.id)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const renderTabContent = () => {
        switch(activeTab) {
            case 'overview':
                return renderOverview()
            case 'users':
                return renderUsers()
            case 'communities':
                return renderCommunities()
            case 'posts':
                return renderPosts()
            case 'reports':
                return renderReports()
            case 'subscriptions':
                return <Subscriptions />
            case 'analytics':
                return <Analytics />
            case 'announcements':
                return <Announcements />
            case 'settings':
                return <PlatformSettings />
            default:
                return renderOverview()
        }
    }

    const renderOverview = () => (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} /> Platform Overview
            </h2>
            <p className="text-gray-500">Welcome to the admin dashboard. Use the tabs above to manage your platform.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="text-2xl font-bold text-purple-600">R{(stats.totalCommunities || 0) * 25}.00</div>
                    <div className="text-xs text-gray-400">From community subscriptions</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Active Users</div>
                    <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Communities</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalCommunities}</div>
                </div>
            </div>
        </div>
    )

    const renderUsers = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Verified</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(userItem => (
                            <tr key={userItem.id}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {userItem.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-medium">{userItem.full_name || userItem.username}</span>
                                        {userItem.is_verified && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{userItem.email || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{userItem.phone || 'N/A'}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-1 rounded-full ${userItem.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {userItem.role || 'user'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {userItem.is_banned ? (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                            <Ban size={12} /> Banned
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                            <Check size={12} /> Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {userItem.is_verified ? (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                            <Check size={12} /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Not verified</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {userItem.is_verified ? (
                                            <button onClick={() => handleUnverifyUser(userItem.id)} className="text-orange-500 hover:text-orange-700 text-sm" disabled={userItem.role === 'admin'}>Unverify</button>
                                        ) : (
                                            <button onClick={() => handleVerifyUser(userItem.id)} className="text-blue-500 hover:text-blue-700 text-sm" disabled={userItem.role === 'admin'}>Verify</button>
                                        )}
                                        {userItem.is_banned ? (
                                            <button onClick={() => handleUnbanUser(userItem.id)} className="text-green-500 hover:text-green-700 text-sm" disabled={userItem.role === 'admin'}>Unban</button>
                                        ) : (
                                            <button onClick={() => handleBanUser(userItem.id, userItem.username)} className="text-orange-500 hover:text-orange-700 text-sm" disabled={userItem.role === 'admin'}>Ban</button>
                                        )}
                                        <button onClick={() => handleDeleteUser(userItem.id)} className="text-red-500 hover:text-red-700 text-sm" disabled={userItem.role === 'admin'}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderCommunities = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Community</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Creator</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Members</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Posts</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {communities.map(community => (
                            <tr key={community.id}>
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                    <Building2 size={16} className="text-gray-400" />
                                    {community.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{community.profiles?.username || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm">{community.member_count || 0}</td>
                                <td className="px-4 py-3 text-sm">{community.post_count || 0}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDeleteCommunity(community.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderPosts = () => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Post</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Author</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Likes</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Comments</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {posts.map(post => (
                            <tr key={post.id}>
                                <td className="px-4 py-3 text-sm max-w-xs truncate">{post.text || 'No text'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{post.profiles?.username || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm">{post.likes_count || 0}</td>
                                <td className="px-4 py-3 text-sm">{post.comments_count || 0}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderReports = () => {
        const pendingReports = reports.filter(r => r.status === 'pending')
        
        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Flag size={18} /> Reports ({pendingReports.length} pending)
                        </h3>
                        <p className="text-xs text-gray-400">Review reported content and take action</p>
                    </div>
                    <button 
                        onClick={loadReports}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
                
                {reportLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reports yet</p>
                        <p className="text-sm text-gray-400">Reports from users will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {reports.map((report) => {
                            const isPending = report.status === 'pending'
                            const reporter = report.reporter
                            const targetUser = report.targetUser
                            
                            return (
                                <div key={report.id} className={`p-4 ${isPending ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col gap-3">
                                        {/* Reporter Info */}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500">Reported by:</span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    @{reporter?.username || 'Unknown User'}
                                                    {reporter?.is_verified && <Check size={12} className="text-blue-500 ml-1" />}
                                                    {reporter?.is_banned && <Ban size={12} className="text-red-500 ml-1" />}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Flag size={16} className="text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500">Reason:</span>
                                                <span className="text-sm font-semibold text-red-600 capitalize">
                                                    {report.reason?.replace('_', ' ') || 'No reason'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(report.created_at).toLocaleString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {report.status}
                                            </span>
                                        </div>

                                        {/* Target User */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500">Reported user:</span>
                                            <span className="text-sm font-medium text-gray-800">
                                                @{targetUser?.username || 'Unknown User'}
                                                {targetUser?.is_verified && <Check size={12} className="text-blue-500 ml-1" />}
                                                {targetUser?.is_banned && <Ban size={12} className="text-red-500 ml-1" />}
                                            </span>
                                        </div>

                                        {/* Reported Content */}
                                        {report.postContent ? (
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-gray-500">Reported Post:</span>
                                                    <button
                                                        onClick={() => window.open(`/feed?highlight=${report.target_id}`, '_blank')}
                                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <Eye size={14} /> View Post
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-700">{report.postContent.text || 'No content'}</p>
                                                {report.postContent.image && (
                                                    <img 
                                                        src={report.postContent.image} 
                                                        alt="Reported content" 
                                                        className="mt-2 max-h-32 rounded object-contain"
                                                    />
                                                )}
                                            </div>
                                        ) : report.target_type === 'post' ? (
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <span className="text-xs text-gray-400">Post content not available (may have been deleted)</span>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <span className="text-xs text-gray-400">Target type: {report.target_type}</span>
                                            </div>
                                        )}

                                        {/* Description if provided */}
                                        {report.description && (
                                            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                                <span className="font-medium">Note:</span> {report.description}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {isPending && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button 
                                                    onClick={() => handleActionOnReport(report, 'resolve')}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                                                >
                                                    <CheckCircle size={14} /> Resolve
                                                </button>
                                                <button 
                                                    onClick={() => handleActionOnReport(report, 'dismiss')}
                                                    className="px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition flex items-center gap-1"
                                                >
                                                    <XCircle size={14} /> Dismiss
                                                </button>
                                                <button 
                                                    onClick={() => handleActionOnReport(report, 'delete_post')}
                                                    className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition flex items-center gap-1"
                                                >
                                                    <Trash2 size={14} /> Delete Post
                                                </button>
                                                <button 
                                                    onClick={() => handleActionOnReport(report, 'ban_user')}
                                                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                                                >
                                                    <Ban size={14} /> Ban User
                                                </button>
                                                <button 
                                                    onClick={() => handleActionOnReport(report, 'warn_user')}
                                                    className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition flex items-center gap-1"
                                                >
                                                    <AlertTriangle size={14} /> Warn User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-purple-700 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6" />
                            <span className="font-bold text-xl">Admin Panel</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm">{user?.email}</span>
                            <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                            <Users size={14} /> Users
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalCommunities}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                            <Building2 size={14} /> Communities
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.totalPosts}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                            <FileText size={14} /> Posts
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.totalPredictions}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                            <BarChart3 size={14} /> Predictions
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.totalReports}</div>
                        <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                            <Flag size={14} /> Reports
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <BarChart3 size={16} /> Overview
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Users size={16} /> Users ({stats.totalUsers})
                    </button>
                    <button onClick={() => setActiveTab('communities')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'communities' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Building2 size={16} /> Communities ({stats.totalCommunities})
                    </button>
                    <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'posts' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <FileText size={16} /> Posts ({stats.totalPosts})
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Flag size={16} /> Reports ({stats.totalReports})
                    </button>
                    <button onClick={() => setActiveTab('subscriptions')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'subscriptions' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <CreditCard size={16} /> Subscriptions
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <BarChart3 size={16} /> Analytics
                    </button>
                    <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'announcements' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Megaphone size={16} /> Announcements
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        <Settings size={16} /> Settings
                    </button>
                </div>

                {renderTabContent()}
            </div>
        </div>
    )
}