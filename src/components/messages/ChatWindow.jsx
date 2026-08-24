 import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send, ChevronLeft, User, Check, CheckCheck } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, formatDistanceToNow } from 'date-fns'

export default function ChatWindow({ userId, onBack, onClose }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState(null)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Update last_seen while user is in chat
    useEffect(() => {
        if (!user) return

        const updateLastSeen = async () => {
            await supabase
                .from('profiles')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', user.id)
        }

        updateLastSeen()
        const interval = setInterval(updateLastSeen, 30000)

        return () => clearInterval(interval)
    }, [user])

    useEffect(() => {
        if (userId) {
            loadMessages()
            loadUserInfo()
            
            // Subscribe to new messages
            const subscription = supabase
                .channel(`messages-${user.id}-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_id=eq.${userId},receiver_id=eq.${user.id}`
                    },
                    () => {
                        loadMessages()
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_id=eq.${user.id},receiver_id=eq.${userId}`
                    },
                    () => {
                        loadMessages()
                    }
                )
                .subscribe()

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [userId, user])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadUserInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, last_seen')
                .eq('id', userId)
                .single()

            if (error) throw error
            setOtherUser(data)
        } catch (error) {
            console.error('Error loading user info:', error)
        }
    }

    const loadMessages = async () => {
        setLoading(true)
        try {
            // Mark messages as read
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', userId)
                .eq('receiver_id', user.id)
                .eq('read', false)

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: userId,
                    content: newMessage.trim()
                })
                .select()
                .single()

            if (error) throw error

            setMessages(prev => [...prev, data])
            setNewMessage('')
            inputRef.current?.focus()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    // ---------- STATUS HELPERS ----------
    const isOnline = (lastSeen) => {
        if (!lastSeen) return false
        const diff = Date.now() - new Date(lastSeen).getTime()
        return diff < 60000 // 60 seconds = online
    }

    const getStatusText = (lastSeen) => {
        if (!lastSeen) return 'Offline'
        if (isOnline(lastSeen)) return '🟢 Online'
        return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
    }

    // ---------- TIMESTAMP HELPERS ----------
    const formatMessageTime = (date) => {
        const messageDate = new Date(date)
        if (isToday(messageDate)) {
            return `Today at ${format(messageDate, 'h:mm a')}`
        } else if (isYesterday(messageDate)) {
            return `Yesterday at ${format(messageDate, 'h:mm a')}`
        } else if (isThisWeek(messageDate)) {
            return `${format(messageDate, 'EEEE')} at ${format(messageDate, 'h:mm a')}`
        } else {
            return format(messageDate, 'MMM d, yyyy • h:mm a')
        }
    }

    if (!userId) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Select a conversation
                    </h3>
                    <p className="text-gray-400">
                        Choose a user from the list to start messaging
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-400">Loading messages...</div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden">
                    {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt={otherUser.username} className="w-full h-full object-cover" />
                    ) : (
                        otherUser?.full_name?.[0]?.toUpperCase() || otherUser?.username?.[0]?.toUpperCase() || 'U'
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">
                        {otherUser?.full_name || otherUser?.username}
                    </p>
                    <p className="text-xs text-gray-400">
                        {getStatusText(otherUser?.last_seen)}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <p className="text-gray-400">No messages yet</p>
                            <p className="text-sm text-gray-400">Say hello to {otherUser?.full_name || otherUser?.username}</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user.id
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                                        isOwn
                                            ? 'bg-gray-800 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'
                                    }`}
                                >
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                                        isOwn ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                        <span>{formatMessageTime(msg.created_at)}</span>
                                        {isOwn && (
                                            msg.read ? (
                                                <CheckCheck size={14} className="text-green-400" />
                                            ) : (
                                                <Check size={14} />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-800 dark:text-white transition-colors duration-200"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-gray-800 dark:bg-white text-white dark:text-gray-800 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    )
}