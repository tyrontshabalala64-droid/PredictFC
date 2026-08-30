 // src/components/messages/ChatWindow.jsx
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
        if (!userId || !user || !isMounted.current) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: true })

            if (error) throw error

            const filteredMessages = (data || []).filter(msg => 
                (msg.sender_id === userId && msg.receiver_id === user.id) ||
                (msg.sender_id === user.id && msg.receiver_id === userId)
            )

            if (isMounted.current) {
                setMessages(filteredMessages)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
            if (isMounted.current) {
                setMessages([])
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
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

    // Voice recording functions
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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 dark:bg-gray-900">
                <MessageCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
            </div>
        )
    }

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
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
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <User size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">User not found</p>
                    <button onClick={onBack} className="text-blue-500 text-sm mt-2">Go back</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* ===== CHAT HEADER - NO CALL/VIDEO BUTTONS ===== */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10 shadow-sm">
                <button 
                    onClick={onBack}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition flex-shrink-0"
                >
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>

                <Link to={`/profile/${otherUser.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                            {otherUser.avatar_url ? (
                                <img 
                                    src={otherUser.avatar_url} 
                                    alt={otherUser.username} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={16} className="text-gray-500 dark:text-gray-400" />
                            )}
                        </div>
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                                {otherUser.full_name || otherUser.username}
                            </span>
                            {otherUser.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {isOnline ? '🟢 Online' : 'Offline'}
                        </p>
                    </div>
                </Link>

                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition flex-shrink-0"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                )}
            </div>

            {/* ===== TYPING INDICATOR ===== */}
            {otherUserIsTyping && (
                <div className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    {otherUser.full_name || otherUser.username} is typing...
                </div>
            )}

            {/* ===== MESSAGES AREA ===== */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                                    <div className={`flex items-end gap-1.5 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {!isOwn && showAvatar && (
                                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {otherUser.avatar_url ? (
                                                    <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={10} className="text-gray-500" />
                                                )}
                                            </div>
                                        )}
                                        {!isOwn && !showAvatar && <div className="w-6 flex-shrink-0"></div>}
                                        
                                        <div>
                                            <div className={`px-3 py-1.5 rounded-2xl text-sm ${
                                                isOwn 
                                                    ? 'bg-blue-500 text-white rounded-br-sm' 
                                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
                                            }`}>
                                                {msg.voice_url ? (
                                                    <audio src={msg.voice_url} controls className="h-8 max-w-[150px]" />
                                                ) : (
                                                    <p className="break-words">{msg.content}</p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-0.5 mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                                <span>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isOwn && (
                                                    msg.read ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} />
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

            {/* ===== VOICE RECORDING UI ===== */}
            {isRecording && (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-red-600 dark:text-red-400">Recording</span>
                            </div>
                            <WaveformAnimation isRecording={isRecording} />
                            <span className="text-xs font-mono text-red-600 dark:text-red-400">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={cancelRecording}
                                className="p-1.5 text-gray-500 hover:text-red-500 transition rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={stopRecording}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs flex items-center gap-1"
                            >
                                <Square size={12} /> Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== VOICE MESSAGE PREVIEW ===== */}
            {audioURL && !isRecording && (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 flex-shrink-0">
                    <audio src={audioURL} controls className="h-8 flex-1" />
                    <button
                        onClick={sendVoiceMessage}
                        disabled={uploadingVoice}
                        className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {uploadingVoice ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                    <button
                        onClick={() => {
                            setAudioBlob(null)
                            setAudioURL(null)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ===== MESSAGE INPUT - FIXED AT BOTTOM ===== */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="flex items-center gap-1.5 px-2 py-2">
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
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm min-h-[40px]"
                        disabled={sending || isRecording}
                    />
                    
                    {!isRecording && !audioURL && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-shrink-0"
                        >
                            <Mic size={20} />
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !audioBlob) || sending || isRecording}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex-shrink-0 w-10 h-10 flex items-center justify-center"
                    >
                        {sending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    )
}