 import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { 
    Send, 
    ArrowLeft, 
    User, 
    Check, 
    CheckCheck, 
    Loader,
    X,
    MessageCircle,
    Mic,
    Square,
    Trash2
} from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

// ============================================
// WAVEFORM ANIMATION COMPONENT
// ============================================
function WaveformAnimation({ isRecording }) {
    if (!isRecording) return null
    
    const bars = [4, 8, 12, 16, 20, 16, 12, 8, 4]
    
    return (
        <div className="flex items-center gap-0.5 h-6">
            {bars.map((height, index) => (
                <div
                    key={index}
                    className="w-1 bg-red-500 rounded-full animate-wave"
                    style={{
                        height: `${height}px`,
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: '0.6s'
                    }}
                />
            ))}
        </div>
    )
}

export default function ChatWindow({ userId, otherUser: propOtherUser, onBack, onClose, onMessageSent }) {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [otherUser, setOtherUser] = useState(propOtherUser || null)
    const [isOnline, setIsOnline] = useState(false)
    const [otherUserIsTyping, setOtherUserIsTyping] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioURL, setAudioURL] = useState(null)
    const [uploadingVoice, setUploadingVoice] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const typingTimeoutRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const timerIntervalRef = useRef(null)
    const isMounted = useRef(true)
    const loadAttempted = useRef(false)

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }, [])

    // Load user info if not provided
    useEffect(() => {
        if (userId && !propOtherUser) {
            loadUserInfo()
        } else if (propOtherUser) {
            setOtherUser(propOtherUser)
            setIsOnline(propOtherUser.last_seen ? new Date(propOtherUser.last_seen) > new Date(Date.now() - 60000) : false)
        }
    }, [userId, propOtherUser])

    // Load messages - ONLY WHEN userId and user are available
    useEffect(() => {
        if (userId && user && !loadAttempted.current) {
            loadAttempted.current = true
            console.log('📩 Loading messages for chat:', userId)
            loadMessages()
            markMessagesAsRead()
        }
    }, [userId, user])

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Subscribe to new messages
    useEffect(() => {
        if (!userId || !user) return

        const subscription = supabase
            .channel(`chat-${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                // Check if this message belongs to this chat
                if ((payload.new.sender_id === userId && payload.new.receiver_id === user.id) ||
                    (payload.new.sender_id === user.id && payload.new.receiver_id === userId)) {
                    console.log('📩 New message received, reloading...')
                    loadMessages()
                }
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [userId, user])

    // Typing indicator subscription
    useEffect(() => {
        if (!userId || !user) return

        const typingChannel = supabase
            .channel(`typing-${userId}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.userId === userId) {
                    setOtherUserIsTyping(true)
                    clearTimeout(typingTimeoutRef.current)
                    typingTimeoutRef.current = setTimeout(() => {
                        setOtherUserIsTyping(false)
                    }, 3000)
                }
            })
            .subscribe()

        return () => {
            typingChannel.unsubscribe()
            clearTimeout(typingTimeoutRef.current)
        }
    }, [userId, user])

    const loadUserInfo = async () => {
        if (!userId) return
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified, last_seen')
                .eq('id', userId)
                .single()

            if (error) throw error
            if (isMounted.current) {
                setOtherUser(data)
                if (data.last_seen) {
                    setIsOnline(new Date(data.last_seen) > new Date(Date.now() - 60000))
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error)
        }
    }

    const loadMessages = async () => {
        if (!userId || !user || !isMounted.current) {
            console.warn('⚠️ Cannot load messages: missing userId or user')
            return
        }

        console.log('🔄 Loading messages for chat...')
        setLoading(true)
        try {
            // ✅ FIXED QUERY - Use a single or() with all conditions
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
                    `sender_id.eq.${userId},receiver_id.eq.${userId}`
                )
                .order('created_at', { ascending: true })

            if (error) {
                console.error('❌ Error fetching messages:', error)
                throw error
            }

            // Filter messages that belong to this conversation (both sender and receiver match)
            const filteredMessages = (data || []).filter(msg => 
                (msg.sender_id === userId && msg.receiver_id === user.id) ||
                (msg.sender_id === user.id && msg.receiver_id === userId)
            )

            console.log(`📩 Loaded ${filteredMessages.length} messages`)
            
            if (isMounted.current) {
                setMessages(filteredMessages)
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error)
            // Show error but don't keep loading
            if (isMounted.current) {
                setMessages([])
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
                console.log('✅ Loading complete')
            }
        }
    }

    const markMessagesAsRead = async () => {
        if (!userId || !user) return
        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', userId)
                .eq('receiver_id', user.id)
                .eq('read', false)
        } catch (error) {
            console.error('Error marking messages as read:', error)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleTyping = () => {
        if (!userId || !user) return
        
        const typingChannel = supabase.channel(`typing-${userId}`)
        typingChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id }
        })
    }

    // Voice recording functions (keep your existing ones)
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })
            
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })
            
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data)
                }
            }

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioURL(URL.createObjectURL(blob))
                setIsRecording(false)
                setRecordingTime(0)
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current)
                }
                recorder.stream.getTracks().forEach(track => track.stop())
            }

            recorder.start(100)
            mediaRecorderRef.current = recorder
            setIsRecording(true)
            setRecordingTime(0)
            
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Please allow microphone access to record voice messages.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
    }

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current)
            }
        }
        setAudioBlob(null)
        setAudioURL(null)
        setIsRecording(false)
        setRecordingTime(0)
    }

    const sendVoiceMessage = async () => {
        if (!audioBlob || !userId) return

        setUploadingVoice(true)
        try {
            const fileName = `voice-${Date.now()}-${user.id}.webm`
            
            const { data, error } = await supabase.storage
                .from('voice-messages')
                .upload(fileName, audioBlob, {
                    contentType: 'audio/webm',
                    cacheControl: '3600'
                })

            if (error) {
                console.error('Storage upload error:', error)
                throw new Error('Failed to upload voice message: ' + error.message)
            }

            const { data: urlData } = supabase.storage
                .from('voice-messages')
                .getPublicUrl(fileName)

            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: userId,
                    content: '🎤 Voice message',
                    voice_url: urlData.publicUrl,
                    read: false
                })

            if (msgError) {
                console.error('Message insert error:', msgError)
                throw new Error('Failed to save voice message: ' + msgError.message)
            }

            setAudioBlob(null)
            setAudioURL(null)
            if (onMessageSent) onMessageSent()
            loadMessages()
        } catch (error) {
            console.error('Error sending voice message:', error)
            alert('Failed to send voice message: ' + error.message)
        } finally {
            setUploadingVoice(false)
        }
    }

    const handleSend = async (e) => {
        e?.preventDefault()
        if (!newMessage.trim() || sending || !userId) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage('')

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: userId,
                    content: content,
                    read: false
                })
                .select()
                .single()

            if (error) throw error
            setMessages(prev => [...prev, data])
            if (onMessageSent) onMessageSent()
            scrollToBottom()
        } catch (error) {
            console.error('Error sending message:', error)
            setNewMessage(content)
        } finally {
            setSending(false)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    // If no userId, show empty state
    if (!userId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
            </div>
        )
    }

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Loading messages...</p>
                </div>
            </div>
        )
    }

    // If no other user found
    if (!otherUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <User size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">User not found</p>
                    <button onClick={onBack} className="text-blue-500 text-sm mt-2">Go back</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button 
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                )}

                <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                            {otherUser.avatar_url ? (
                                <img 
                                    src={otherUser.avatar_url} 
                                    alt={otherUser.username} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={16} className="sm:size-18 text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">
                                {otherUser.full_name || otherUser.username}
                            </span>
                            {otherUser.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {isOnline ? '🟢 Online' : 'Offline'}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Typing Indicator */}
            {otherUserIsTyping && (
                <div className="px-4 py-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    {otherUser.full_name || otherUser.username} is typing...
                </div>
            )}

            {/* Messages - Scrollable area with bottom padding for mobile */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 pb-20 md:pb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            No messages yet with {otherUser.full_name || otherUser.username}
                        </p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                            Say hello! 👋
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const isOwn = msg.sender_id === user.id
                            const showAvatar = !isOwn && (index === 0 || messages[index-1]?.sender_id !== msg.sender_id)
                            
                            return (
                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {!isOwn && showAvatar && (
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {otherUser.avatar_url ? (
                                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={12} className="sm:size-14 text-gray-500" />
                                                )}
                                            </div>
                                        )}
                                        {!isOwn && !showAvatar && <div className="w-6 sm:w-8 flex-shrink-0"></div>}
                                        
                                        <div>
                                            <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl ${
                                                isOwn 
                                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm'
                                            }`}>
                                                {msg.voice_url ? (
                                                    <audio src={msg.voice_url} controls className="h-8 max-w-[150px] sm:max-w-[200px]" />
                                                ) : (
                                                    <p className="text-sm break-words">{msg.content}</p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isOwn && (
                                                    <span>
                                                        {msg.read ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Voice Recording UI */}
            {isRecording && (
                <div className="px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                                    Recording
                                </span>
                            </div>
                            <WaveformAnimation isRecording={isRecording} />
                            <span className="text-xs sm:text-sm font-mono text-red-600 dark:text-red-400">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={cancelRecording}
                                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 transition rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Cancel recording"
                            >
                                <Trash2 size={16} className="sm:size-18" />
                            </button>
                            <button
                                onClick={stopRecording}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-xs sm:text-sm"
                            >
                                <Square size={14} className="sm:size-16" />
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice message preview */}
            {audioURL && !isRecording && (
                <div className="px-3 py-2 sm:px-4 sm:py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <audio src={audioURL} controls className="h-8 sm:h-10 flex-1" />
                    <button
                        onClick={sendVoiceMessage}
                        disabled={uploadingVoice}
                        className="p-1.5 sm:p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {uploadingVoice ? <Loader size={14} className="sm:size-18 animate-spin" /> : <Send size={16} className="sm:size-18" />}
                    </button>
                    <button
                        onClick={() => {
                            setAudioBlob(null)
                            setAudioURL(null)
                        }}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition"
                    >
                        <X size={16} className="sm:size-18" />
                    </button>
                </div>
            )}

            {/* Message Input - Fixed at bottom */}
            <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 pb-safe">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value)
                            if (e.target.value.length > 0) {
                                handleTyping()
                            }
                        }}
                        placeholder={`Message ${otherUser.full_name || otherUser.username}...`}
                        className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        disabled={sending || isRecording}
                    />
                    
                    {/* Voice Recording Button */}
                    {!isRecording && !audioURL && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-shrink-0"
                            title="Record voice message"
                        >
                            <Mic size={18} className="sm:size-20" />
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !audioBlob) || sending || isRecording}
                        className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0 text-sm"
                    >
                        {sending ? <Loader size={16} className="sm:size-18 animate-spin" /> : <Send size={16} className="sm:size-18" />}
                    </button>
                </form>
            </div>
        </div>
    )
}