 import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Flag, X, Check, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Report types
export const REPORT_TYPES = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    INAPPROPRIATE: 'inappropriate',
    MISINFORMATION: 'misinformation',
    COPYRIGHT: 'copyright',
    OTHER: 'other'
}

export const REPORT_LABELS = {
    [REPORT_TYPES.SPAM]: 'Spam or misleading',
    [REPORT_TYPES.HARASSMENT]: 'Harassment or bullying',
    [REPORT_TYPES.HATE_SPEECH]: 'Hate speech',
    [REPORT_TYPES.INAPPROPRIATE]: 'Inappropriate content',
    [REPORT_TYPES.MISINFORMATION]: 'Misinformation',
    [REPORT_TYPES.COPYRIGHT]: 'Copyright violation',
    [REPORT_TYPES.OTHER]: 'Other'
}

export default function ReportButton({ 
    targetId, 
    targetType, // 'post', 'comment', 'reply', 'user'
    targetUserId,
    onReported,
    className = ''
}) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [showModal, setShowModal] = useState(false)
    const [selectedReason, setSelectedReason] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [error, setError] = useState('')
    const [debugInfo, setDebugInfo] = useState(null)

    const handleReport = async () => {
        setError('')
        setDebugInfo(null)
        
        if (!user) {
            showToast('Please sign in to report content', 'warning')
            return
        }

        if (!selectedReason) {
            setError('Please select a reason for reporting')
            return
        }

        setSubmitting(true)
        
        try {
            const reportData = {
                reporter_id: user.id,
                target_id: String(targetId),
                target_type: targetType,
                target_user_id: targetUserId || null,
                reason: selectedReason,
                description: description.trim() || null,
                status: 'pending'
            }

            console.log('Submitting report:', reportData)
            setDebugInfo(reportData)

            const { data, error: supabaseError } = await supabase
                .from('reports')
                .insert(reportData)
                .select()
                .single()

            if (supabaseError) {
                console.error('Supabase error:', supabaseError)
                throw new Error(supabaseError.message)
            }

            console.log('Report submitted successfully:', data)
            
            setShowSuccess(true)
            showToast('Report submitted successfully. We\'ll review it shortly.', 'success')
            
            if (onReported) {
                onReported()
            }
            
            setTimeout(() => {
                setShowModal(false)
                setShowSuccess(false)
                setSelectedReason('')
                setDescription('')
                setError('')
                setDebugInfo(null)
            }, 2000)

        } catch (error) {
            console.error('Error reporting:', error)
            setError(error.message || 'Failed to submit report. Please try again.')
            showToast('Failed to submit report: ' + error.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (!user) return null

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setShowModal(true)
                    setError('')
                    setDebugInfo(null)
                }}
                className={`text-gray-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 ${className}`}
                title="Report"
            >
                <Flag size={16} />
                <span className="text-xs">Report</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => {
                    if (!submitting) {
                        setShowModal(false)
                        setSelectedReason('')
                        setDescription('')
                        setError('')
                        setDebugInfo(null)
                    }
                }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {showSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Report Submitted</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    Thank you for helping keep our community safe. We'll review this content shortly.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Flag size={24} className="text-red-600" />
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Report Content</h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!submitting) {
                                                setShowModal(false)
                                                setSelectedReason('')
                                                setDescription('')
                                                setError('')
                                                setDebugInfo(null)
                                            }
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        disabled={submitting}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Help us understand the issue. Select a reason and provide any additional details.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Reason for reporting *
                                        </label>
                                        <div className="space-y-2">
                                            {Object.entries(REPORT_LABELS).map(([value, label]) => (
                                                <button
                                                    key={value}
                                                    onClick={() => {
                                                        setSelectedReason(value)
                                                        setError('')
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition flex items-center gap-2 ${
                                                        selectedReason === value
                                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                                    disabled={submitting}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                        selectedReason === value
                                                            ? 'border-red-500 bg-red-500'
                                                            : 'border-gray-300 dark:border-gray-500'
                                                    }`}>
                                                        {selectedReason === value && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Additional details (optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide more context about your report..."
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none"
                                            rows="3"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            if (!submitting) {
                                                setShowModal(false)
                                                setSelectedReason('')
                                                setDescription('')
                                                setError('')
                                                setDebugInfo(null)
                                            }
                                        }}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!selectedReason || submitting}
                                        className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Flag size={18} />
                                                Submit Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}