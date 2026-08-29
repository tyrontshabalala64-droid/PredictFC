 import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { User, MessageCircle, Clock, Users, ChevronRight, Loader } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

export default function ConversationList({ 
    conversations, 
    loading, 
    onSelectConversation, 
    selectedUserId,
    onRefresh 
}) {
    const { user } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-12">
                <Loader size={32} className="text-gray-400 animate-spin" />
            </div>
        )
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                <MessageCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Start following users and send them a message!
                </p>
                <Link 
                    to="/community" 
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Find people to follow →
                </Link>
            </div>
        )
    }

    const formatTime = (date) => {
        const now = new Date()
        const msgDate = new Date(date)
        const diff = now - msgDate
        
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
        if (diff < 86400000) return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (diff < 172800000) return 'Yesterday'
        return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {conversations.map((conversation) => {
                const otherUser = conversation.user
                const lastMessage = conversation.lastMessage
                const isUnread = conversation.unread
                const unreadCount = conversation.unreadCount || 0

                if (!otherUser) return null

                const isOnline = otherUser.last_seen && new Date(otherUser.last_seen) > new Date(Date.now() - 60000)

                return (
                    <button
                        key={otherUser.id}
                        onClick={() => onSelectConversation(otherUser.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left ${
                            selectedUserId === otherUser.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                                {otherUser.avatar_url ? (
                                    <img 
                                        src={otherUser.avatar_url} 
                                        alt={otherUser.username} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={20} className="text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                            {isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-800 dark:text-white truncate">
                                    {otherUser.full_name || otherUser.username}
                                </span>
                                {otherUser.is_verified && <VerifiedBadge size="sm" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <p className="text-gray-500 dark:text-gray-400 truncate flex-1">
                                    {lastMessage?.content || 'No messages yet'}
                                </p>
                                {isUnread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                            </div>
                        </div>

                        {/* Time and unread count */}
                        <div className="flex flex-col items-end flex-shrink-0 gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {lastMessage ? formatTime(lastMessage.created_at) : ''}
                            </span>
                            {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                            <ChevronRight size={16} className="text-gray-400" />
                        </div>
                    </button>
                )
            })}
        </div>
    )
}