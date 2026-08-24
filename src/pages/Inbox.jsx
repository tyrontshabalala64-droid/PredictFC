 import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useLocation } from 'react-router-dom'
import ConversationList from '../components/messages/ConversationList'
import ChatWindow from '../components/messages/ChatWindow'
import { MessageCircle } from 'lucide-react'

export default function Inbox() {
    const { user } = useAuth()
    const { t } = useTranslation()
    const location = useLocation()
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [showChat, setShowChat] = useState(false)

    // Check URL params for user to message
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const userId = params.get('user')
        if (userId) {
            setSelectedUserId(userId)
            setShowChat(true)
        }
    }, [location])

    const handleSelectConversation = (userId) => {
        setSelectedUserId(userId)
        setShowChat(true)
    }

    const handleBack = () => {
        setShowChat(false)
    }

    const handleClose = () => {
        setSelectedUserId(null)
        setShowChat(false)
        // Remove query param from URL
        window.history.replaceState({}, '', '/inbox')
    }

    return (
        <div className="h-[calc(100vh-120px)]">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full overflow-hidden transition-colors duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <MessageCircle size={24} className="text-gray-700 dark:text-gray-300" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('inbox') || 'Inbox'}
                    </h1>
                </div>

                {/* Content */}
                <div className="flex h-[calc(100%-60px)]">
                    {/* Conversation List - Hide on mobile when chat is open */}
                    <div className={`${showChat ? 'hidden md:block md:w-96' : 'w-full md:w-96'} border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto`}>
                        <ConversationList 
                            onSelectConversation={handleSelectConversation}
                            selectedUserId={selectedUserId}
                        />
                    </div>

                    {/* Chat Window */}
                    <div className={`${showChat ? 'flex-1' : 'flex-1 hidden md:flex'} flex-col`}>
                        <ChatWindow 
                            userId={selectedUserId} 
                            onBack={handleBack}
                            onClose={handleClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}