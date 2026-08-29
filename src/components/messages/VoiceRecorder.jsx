// src/components/messages/VoiceRecorder.jsx
import React, { useState } from 'react'
import { Mic, Square, Send, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function VoiceRecorder({ userId, onSend, onCancel }) {
    const { user } = useAuth()
    const [recording, setRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [audioURL, setAudioURL] = useState(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks = []

            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' })
                setAudioBlob(blob)
                setAudioURL(URL.createObjectURL(blob))
                setRecording(false)
            }

            recorder.start()
            setMediaRecorder(recorder)
            setRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Please allow microphone access to record voice messages.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
    }

    const sendVoiceMessage = async () => {
        if (!audioBlob || !userId) return

        setUploading(true)
        try {
            // Upload to Supabase Storage
            const fileName = `voice-${Date.now()}-${user.id}.webm`
            const { data, error } = await supabase.storage
                .from('voice-messages')
                .upload(fileName, audioBlob)

            if (error) throw error

            const { data: urlData } = supabase.storage
                .from('voice-messages')
                .getPublicUrl(fileName)

            // Send message with voice URL
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: userId,
                    content: '🎤 Voice message',
                    voice_url: urlData.publicUrl,
                    read: false
                })

            if (msgError) throw msgError

            onSend()
            setAudioBlob(null)
            setAudioURL(null)
        } catch (error) {
            console.error('Error sending voice message:', error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {!recording && !audioBlob && (
                <button
                    onClick={startRecording}
                    className="p-2 text-gray-500 hover:text-blue-600 transition rounded-full hover:bg-blue-50"
                    title="Record voice message"
                >
                    <Mic size={20} />
                </button>
            )}

            {recording && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-red-500 font-medium">Recording...</span>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                        <Square size={16} />
                    </button>
                </div>
            )}

            {audioBlob && !recording && (
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                    <audio src={audioURL} controls className="h-8" />
                    <button
                        onClick={sendVoiceMessage}
                        disabled={uploading}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-full transition"
                    >
                        {uploading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                    <button
                        onClick={() => {
                            setAudioBlob(null)
                            setAudioURL(null)
                            onCancel?.()
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full transition"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    )
}