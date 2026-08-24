 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Reply, 
  Building2, 
  Check, 
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

export default function Notifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (user) {
            loadNotifications()
        }
    }, [user])

    const loadNotifications = async () => {
        if (!user) {
            setLoading(false)
            return
        }
        
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    from_user:from_user_id (id, username, full_name, avatar_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) {
                console.error('Error loading notifications:', error)
                throw error
            }

            setNotifications(data || [])
            setUnreadCount(data?.filter(n => !n.read).length || 0)
            
        } catch (error) {
            console.error('Error loading notifications:', error)
            setNotifications([])
            setUnreadCount(0)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadNotifications()
        setRefreshing(false)
    }

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
            
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, read: true } : n
                )
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user?.id)
                .eq('read', false)
            
            setNotifications(prev => 
                prev.map(n => ({ ...n, read: true }))
            )
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'like': return <Heart size={18} className="text-red-500" />
            case 'comment': return <MessageCircle size={18} className="text-blue-500" />
            case 'follow': return <UserPlus size={18} className="text-green-500" />
            case 'reply': return <Reply size={18} className="text-purple-500" />
            case 'join': return <Building2 size={18} className="text-orange-500" />
            case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />
            default: return <Bell size={18} className="text-gray-500" />
        }
    }

    const getNotificationLink = (notification) => {
        if (notification.type === 'follow') {
            return `/profile/${notification.from_user_id}`
        }
        if (notification.type === 'warning') {
            return '/notifications'
        }
        if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') {
            return `/feed?highlight=${notification.post_id || notification.post}`
        }
        if (notification.type === 'join') {
            return `/community/${notification.community_id}`
        }
        return '#'
    }

    const getNotificationMessage = (notification) => {
        const fromName = notification.from_user?.full_name || notification.from_user?.username || 'Someone'
        
        if (notification.type === 'like') {
            return `${fromName} liked your post`
        }
        if (notification.type === 'comment') {
            return `${fromName} commented on your post`
        }
        if (notification.type === 'reply') {
            return `${fromName} replied to your comment`
        }
        if (notification.type === 'follow') {
            return `${fromName} started following you`
        }
        if (notification.type === 'join') {
            return `${fromName} joined your community`
        }
        if (notification.type === 'warning') {
            return notification.message || `${fromName} issued a warning`
        }
        return notification.message || `${fromName} interacted with you`
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Please sign in to view notifications</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Bell size={24} /> Notifications
                    </h1>
                    <p className="text-gray-400 text-sm">Stay updated with what's happening</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
                        title="Refresh notifications"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm flex items-center gap-1"
                        >
                            <Check size={16} /> Mark all as read ({unreadCount})
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="text-gray-400">Loading notifications...</div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">No notifications yet</p>
                    <p className="text-sm text-gray-300">When someone interacts with your posts, you'll see it here</p>
                    <button 
                        onClick={handleRefresh}
                        className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => {
                        const link = getNotificationLink(notification)
                        const message = getNotificationMessage(notification)
                        const icon = getNotificationIcon(notification.type)
                        const isWarning = notification.type === 'warning'
                        
                        return (
                            <Link
                                key={notification.id}
                                to={link}
                                onClick={() => markAsRead(notification.id)}
                                className={`block p-4 rounded-xl transition ${
                                    notification.read
                                        ? 'bg-white hover:bg-gray-50'
                                        : isWarning 
                                            ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500'
                                            : 'bg-gray-50 hover:bg-gray-100 border-l-4 border-gray-800'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-800">
                                                {notification.from_user?.full_name || notification.from_user?.username || 'Someone'}
                                            </span>
                                            <span className={`break-words ${isWarning ? 'text-yellow-700' : 'text-gray-600'}`}>
                                                {message}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <Calendar size={12} />
                                            <span>
                                                {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {notification.read && (
                                                <span className="text-gray-300">• Read</span>
                                            )}
                                            {!notification.read && (
                                                <span className={isWarning ? 'text-yellow-600' : 'text-green-600'}>• New</span>
                                            )}
                                            {isWarning && (
                                                <span className="text-yellow-600">• Warning</span>
                                            )}
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${isWarning ? 'bg-yellow-500' : 'bg-gray-800'}`}></span>
                                    )}
                                    <ArrowRight size={16} className="text-gray-400 flex-shrink-0 mt-2" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}