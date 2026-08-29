 import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import ConversationList from '../components/messages/ConversationList'
import ChatWindow from '../components/messages/ChatWindow'
import { MessageCircle, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BouncingLoader from '../components/BouncingLoader'

export default function Inbox() {
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [showChat, setShowChat] = useState(false)
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredConversations, setFilteredConversations] = useState([])

    // Load conversations and unread count
    const loadConversations = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id (id, username, full_name, avatar_url, is_verified, last_seen),
                    receiver:receiver_id (id, username, full_name, avatar_url, is_verified, last_seen)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error

            const conversationMap = {}
            messages?.forEach(msg => {
                const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
                const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
                
                if (!conversationMap[otherUserId]) {
                    conversationMap[otherUserId] = {
                        user: otherUser,
                        lastMessage: msg,
                        unread: !msg.read && msg.receiver_id === user.id,
                        unreadCount: 0
                    }
                }
                
                if (!msg.read && msg.receiver_id === user.id) {
                    conversationMap[otherUserId].unreadCount++
                }
            })

            const conversationsList = Object.values(conversationMap)
                .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))

            setConversations(conversationsList)
            setFilteredConversations(conversationsList)
            
            const totalUnread = conversationsList.reduce((sum, c) => sum + c.unreadCount, 0)
            setUnreadCount(totalUnread)

        } catch (error) {
            console.error('Error loading conversations:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    // Filter conversations by search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredConversations(conversations)
            return
        }

        const query = searchQuery.toLowerCase().trim()
        const filtered = conversations.filter(conv => {
            const name = conv.user?.full_name?.toLowerCase() || ''
            const username = conv.user?.username?.toLowerCase() || ''
            return name.includes(query) || username.includes(query)
        })
        setFilteredConversations(filtered)
    }, [searchQuery, conversations])

    // Check URL params for user to message
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const userId = params.get('user')
        if (userId) {
            setSelectedUserId(userId)
            setShowChat(true)
        }
    }, [location])

    // Subscribe to new messages for real-time updates
    useEffect(() => {
        if (!user) return

        const subscription = supabase
            .channel('messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`
            }, () => {
                loadConversations()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [user, loadConversations])

    const handleSelectConversation = (userId) => {
        setSelectedUserId(userId)
        setShowChat(true)
        markMessagesAsRead(userId)
    }

    const markMessagesAsRead = async (otherUserId) => {
        if (!user) return
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', otherUserId)
                .eq('receiver_id', user.id)
                .eq('read', false)
            
            setConversations(prev => prev.map(conv => {
                if (conv.user?.id === otherUserId) {
                    return { ...conv, unread: false, unreadCount: 0 }
                }
                return conv
            }))
            setUnreadCount(prev => Math.max(0, prev - (conversations.find(c => c.user?.id === otherUserId)?.unreadCount || 0)))
        } catch (error) {
            console.error('Error marking messages as read:', error)
        }
    }

    const handleBack = () => {
        setShowChat(false)
        setSelectedUserId(null)
        loadConversations()
    }

    const handleClose = () => {
        setSelectedUserId(null)
        setShowChat(false)
        window.history.replaceState({}, '', '/inbox')
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Please sign in to view your messages</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full overflow-hidden">
                {/* Header with Search */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <MessageCircle size={20} className="sm:size-24 text-gray-700 dark:text-gray-300" />
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Inbox</h1>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                        <button
                            onClick={loadConversations}
                            className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            Refresh
                        </button>
                    </div>
                    
                    {/* ✅ Search Bar - Now works within inbox */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex h-[calc(100%-100px)]">
                    {/* Conversation List */}
                    <div className={`${showChat ? 'hidden md:block md:w-96' : 'w-full md:w-96'} border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
                        {loading ? (
                            <div className="flex items-center justify-center h-full py-12">
                                <BouncingLoader size="md" color="green" />
                            </div>
                        ) : (
                            <ConversationList 
                                conversations={filteredConversations}
                                loading={loading}
                                onSelectConversation={handleSelectConversation}
                                selectedUserId={selectedUserId}
                                onRefresh={loadConversations}
                            />
                        )}
                    </div>

                    {/* Chat Window */}
                    <div className={`${showChat ? 'flex-1' : 'flex-1 hidden md:flex'}`}>
                        <ChatWindow 
                            userId={selectedUserId} 
                            onBack={handleBack}
                            onClose={handleClose}
                            onMessageSent={loadConversations}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}