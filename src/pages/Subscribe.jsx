 import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { initiatePayment } from '../services/paymentService'
import { Loader, Trophy, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react'

export default function Subscribe() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [isRenewal, setIsRenewal] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const renew = params.get('renew')
        if (renew === 'true') {
            setIsRenewal(true)
        }
    }, [location])

    const handleSubscribe = async () => {
        if (!user) {
            showToast('Please sign in first', 'error')
            navigate('/login')
            return
        }

        setLoading(true)
        try {
            const result = await initiatePayment({
                amount: 60, // ✅ Updated to R60
                email: user.email,
                fullName: profile?.full_name || user.email,
                userId: user.id,
                type: 'premium'
            });

            if (!result.success) {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Subscription error:', error)
            showToast('Failed to subscribe: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleGoBack = () => {
        navigate(-1)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
                
                {/* Back Button */}
                <button
                    onClick={handleGoBack}
                    className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 transition"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="text-center mb-6 mt-4">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {isRenewal ? 'Renew Premium' : 'Premium Access'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {isRenewal 
                            ? 'Your subscription expired. Renew to regain access.'
                            : 'Unlock the Leaderboard and AI Predictions'}
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                    <div className="text-center">
                        {/* ✅ Updated to R60 */}
                        <span className="text-4xl font-bold text-gray-800">R60</span>
                        <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> View the Leaderboard
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> AI-powered match predictions
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Advanced analytics
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Support the platform
                        </li>
                    </ul>
                </div>

                <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <DollarSign className="w-5 h-5" /> {isRenewal ? 'Renew Now' : 'Subscribe Now'} — R60/month
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                    You will be redirected to Yoco to complete your payment securely.
                </p>

                <div className="text-center mt-6 pt-6 border-t border-gray-200">
                    <Link 
                        to="/" 
                        className="text-sm text-gray-500 hover:text-gray-800 transition"
                    >
                        Go back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}