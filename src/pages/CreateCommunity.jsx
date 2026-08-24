 import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getCachedSettings } from '../services/settingsService'
import { initiatePayment } from '../services/paymentService'
import { Check, X, AlertCircle, Shield, CreditCard, FileText, Users, Trophy, Target } from 'lucide-react'

export default function CreateCommunity() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [checkingSettings, setCheckingSettings] = useState(true)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    const settings = getCachedSettings()
    const communityCreationEnabled = settings?.community_creation_enabled !== false
    const maxCommunities = settings?.max_communities_per_user || 10
    const SETUP_FEE = 100

    const [form, setForm] = useState({
        name: '',
        description: '',
        is_private: true,
        price: 0,
        payment_type: 'free'
    })

    useEffect(() => {
        checkCommunityCreation()
        checkUserCommunityCount()
        setCheckingSettings(false)
    }, [])

    const checkCommunityCreation = async () => {
        if (!communityCreationEnabled) {
            setError('Community creation is currently disabled. Please try again later.')
            showToast('Community creation is disabled', 'error')
        }
    }

    const checkUserCommunityCount = async () => {
        if (!user) return

        try {
            const { count, error } = await supabase
                .from('communities')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', user.id)

            if (error) throw error

            if (count >= maxCommunities) {
                setError(`You have reached the maximum of ${maxCommunities} communities.`)
                showToast(`Maximum ${maxCommunities} communities reached`, 'warning')
            }
        } catch (error) {
            console.error('Error checking community count:', error)
        }
    }

    const handleOpenTerms = () => {
        setShowTermsModal(true)
    }

    const handleCloseTerms = () => {
        setShowTermsModal(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        if (!communityCreationEnabled) {
            setError('Community creation is currently disabled.')
            showToast('Community creation is disabled', 'error')
            setSubmitting(false)
            return
        }

        if (!form.name.trim()) {
            setError('Community name is required')
            setSubmitting(false)
            return
        }

        if (!acceptedTerms) {
            setError('You must accept the Terms & Conditions to create a community')
            showToast('Please accept the Terms & Conditions first', 'warning')
            setSubmitting(false)
            return
        }

        try {
            // 1. Create the community (Setup fee not paid yet)
            const { data: community, error: communityError } = await supabase
                .from('communities')
                .insert({
                    creator_id: user.id,
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    is_private: form.is_private,
                    price: 0,
                    payment_type: 'free',
                    setup_fee_paid: false,
                    setup_fee_amount: SETUP_FEE
                })
                .select()
                .single()

            if (communityError) throw communityError

            // 2. Initiate the R100 Setup Fee
            const result = await initiatePayment({
                amount: SETUP_FEE,
                email: user.email,
                fullName: profile?.full_name || user.email,
                userId: user.id,
                communityId: community.id,
                type: 'setup_fee'
            })

            if (!result.success) {
                await supabase.from('communities').delete().eq('id', community.id)
                throw new Error(result.error || 'Payment failed')
            }

        } catch (error) {
            console.error('Error creating community:', error)
            setError(error.message || 'Failed to create community')
            showToast('Failed to create community: ' + error.message, 'error')
            setSubmitting(false)
        }
    }

    if (checkingSettings) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="text-gray-500">Loading...</div>
            </div>
        )
    }

    if (!communityCreationEnabled) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Community Creation Disabled</h1>
                    <p className="text-gray-500">Community creation is currently disabled. Please check back later.</p>
                    <button
                        onClick={() => navigate('/community')}
                        className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
                    >
                        Back to Communities
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column - Form */}
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Community</h1>
                    <p className="text-gray-500 mb-6">Build your community and earn more</p>

                    {/* Setup Fee Notice */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <CreditCard size={20} className="text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-700">One-time Setup Fee: R{SETUP_FEE}</p>
                                <p className="text-sm text-blue-600">
                                    You'll be redirected to Yoco to pay the setup fee before your community goes live.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Community Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({...form, name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Premier League Predictors"
                                required
                                maxLength="50"
                            />
                            <p className="text-xs text-gray-400 mt-1">{form.name.length}/50 characters</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({...form, description: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="A community for serious football predictors..."
                                rows="4"
                                maxLength="500"
                            />
                            <p className="text-xs text-gray-400 mt-1">{form.description.length}/500 characters</p>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_private}
                                    onChange={(e) => setForm({...form, is_private: e.target.checked})}
                                    className="w-5 h-5 accent-green-600"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Private Community</span>
                                    <p className="text-sm text-gray-500">Only approved members can see posts in this community</p>
                                </div>
                            </label>
                        </div>

                        <div className="mb-6">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="w-5 h-5 accent-green-600 mt-0.5"
                                />
                                <div>
                                    <span className="text-sm text-gray-700">
                                        I have read and agree to the{' '}
                                        <button
                                            type="button"
                                            onClick={handleOpenTerms}
                                            className="text-green-600 hover:text-green-700 font-semibold underline"
                                        >
                                            Community Terms & Conditions
                                        </button>
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">Click the link to read the terms before accepting</p>
                                </div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !acceptedTerms}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Processing...' : `Create Community - Pay R${SETUP_FEE} Setup Fee`}
                        </button>
                    </form>
                </div>

                {/* Right Column - Soccer/Football Icons & Info */}
                <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 rounded-xl p-8 min-h-[400px] border border-gray-100">
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <div className="absolute inset-0 bg-green-100 rounded-full opacity-20 animate-pulse"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="w-28 h-28 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-gray-200">
                                    <Trophy size={56} className="text-green-600" />
                                </div>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Build Your Community</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-6">Create a space for fans to connect, predict, and share.</p>
                        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users size={16} className="text-green-600" />
                                </div>
                                <span className="text-sm text-gray-600">Connect with fellow fans</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Target size={16} className="text-green-600" />
                                </div>
                                <span className="text-sm text-gray-600">Share predictions and insights</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Trophy size={16} className="text-green-600" />
                                </div>
                                <span className="text-sm text-gray-600">Earn from your community</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileText size={24} className="text-green-600" />
                                <h2 className="text-xl font-bold text-gray-800">Community Terms & Conditions</h2>
                            </div>
                            <button onClick={handleCloseTerms} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <Shield size={20} className="text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-blue-700">Fee Structure</p>
                                        <ul className="text-sm text-blue-600 mt-2 space-y-1">
                                            <li>• <strong>Setup Fee:</strong> R100 (one-time)</li>
                                            <li>• <strong>Platform Fee:</strong> 30% of each subscription</li>
                                            <li>• <strong>You Earn:</strong> 70% of each subscription</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-yellow-700">Important Information</p>
                                        <ul className="text-sm text-yellow-600 mt-2 space-y-1">
                                            <li>• You must be 18 years or older</li>
                                            <li>• You are responsible for all content posted</li>
                                            <li>• You agree to moderate your community</li>
                                            <li>• The R100 setup fee is non-refundable</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleCloseTerms} className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}