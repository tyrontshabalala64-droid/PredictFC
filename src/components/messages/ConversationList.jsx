 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { User, Search, ChevronRight, Users, MessageCircle } from 'lucide-react'

export default function ConversationList({ onSelectConversation, selectedUserId }) {
    const { user } = useAuth()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [followingUsers, setFollowingUsers] = useState([])

    useEffect(() => {
        loadConversations()
        loadFollowingUsers()
        
        // Subscribe to new messages
        const subscription = supabase
            .channel('messages-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user?.id}`
                },
                () => {
                    loadConversations()
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [user])

    const loadFollowingUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('followers')
                .select('following_id, profiles:following_id (id, username, full_name, avatar_url, is_verified)')
                .eq('follower_id', user.id)

            if (error) throw error
            setFollowingUsers(data?.map(item => item.profiles).filter(Boolean) || [])
        } catch (error) {
            console.error('Error loading following users:', error)
        }
    }

    const loadConversations = async () => {
        if (!user) return
        
        setLoading(true)
        try {
            // Get all messages where user is sender or receiver
            const { data: messages } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id (id, username, full_name, avatar_url, is_verified),
                    receiver:receiver_id (id, username, full_name, avatar_url, is_verified)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            // Group by conversation partner
            const conversationMap = {}
            messages?.forEach(msg => {
                const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
                const partner = msg.sender_id === user.id ? msg.receiver : msg.sender
                
                if (!conversationMap[partnerId]) {
                    conversationMap[partnerId] = {
                        user: partner,
                        lastMessage: msg,
                        unreadCount: 0,
                        messages: []
                    }
                }
                
                // Count unread messages
                if (!msg.read && msg.receiver_id === user.id) {
                    conversationMap[partnerId].unreadCount++
                }
                
                conversationMap[partnerId].messages.push(msg)
            })

            // Convert to array and sort by last message time
            const conversationList = Object.values(conversationMap)
                .sort((a, b) => 
                    new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
                )

            setConversations(conversationList)
        } catch (error) {
            console.error('Error loading conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (query) => {
        setSearchQuery(query)
        
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified')
                .ilike('username', `%${query}%`)
                .neq('id', user.id)
                .limit(10)

            if (error) throw error
            setSearchResults(data || [])
        } catch (error) {
            console.error('Error searching users:', error)
            setSearchResults([])
        } finally {
            setSearching(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading messages...</div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-800 dark:text-white transition-colors duration-200"
                />
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <Users size={14} /> Search Results
                    </p>
                    <div className="space-y-1">
                        {searchResults.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => {
                                    setSearchQuery('')
                                    setSearchResults([])
                                    onSelectConversation(result.id)
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden flex-shrink-0">
                                    {result.avatar_url ? (
                                        <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                                    ) : (
                                        result.full_name?.[0]?.toUpperCase() || result.username?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                        {result.full_name || result.username}
                                    </p>
                                    <p className="text-sm text-gray-400 truncate">@{result.username}</p>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No users found for "{searchQuery}"</p>
                </div>
            )}

            {/* Quick Contacts - People you follow */}
            {searchQuery.length < 2 && followingUsers.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                            <Users size={14} /> Quick Contacts
                        </p>
                        <span className="text-xs text-gray-400">{followingUsers.length} following</span>
                    </div>
                    <div className="space-y-1">
                        {followingUsers.map((user) => {
                            // Check if there's an existing conversation
                            const hasConversation = conversations.some(c => c.user.id === user.id)
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectConversation(user.id)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            user.full_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 dark:text-white truncate">
                                            {user.full_name || user.username}
                                        </p>
                                        <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                                            @{user.username}
                                            {hasConversation ? (
                                                <span className="text-xs text-green-500">• Active</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">• Start chat</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {hasConversation ? (
                                            <MessageCircle size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                        ) : (
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Conversations List */}
            {conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <User size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        No messages yet
                    </h3>
                    <p className="text-gray-400 max-w-sm">
                        When someone messages you, it will appear here
                    </p>
                    {followingUsers.length === 0 ? (
                        <div className="mt-6">
                            <p className="text-sm text-gray-300 dark:text-gray-500">Quick Contacts</p>
                            <p className="text-xs text-gray-400">Follow more users to start chatting</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mt-4">
                            👆 Click on a contact above to start chatting
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-1">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <MessageCircle size={14} /> Conversations
                    </p>
                    {conversations.map((conv) => (
                        <button
                            key={conv.user.id}
                            onClick={() => onSelectConversation(conv.user.id)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition ${
                                selectedUserId === conv.user.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                            }`}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden">
                                    {conv.user.avatar_url ? (
                                        <img src={conv.user.avatar_url} alt={conv.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        conv.user.full_name?.[0]?.toUpperCase() || conv.user.username?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-800 dark:text-white truncate">
                                        {conv.user.full_name || conv.user.username}
                                    </p>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                                        {conv.lastMessage.sender_id === user.id && 'You: '}
                                        {conv.lastMessage.content}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 ml-2"></span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}