 import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { CheckCircle, Loader, Home, ArrowRight } from 'lucide-react'

export default function PaymentSuccess() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [communityId, setCommunityId] = useState(null)
    const [isPremium, setIsPremium] = useState(false)

    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(window.location.search)
            let paymentId = params.get('payment_id')

            try {
                // 1. If Yoco didn't return an ID, look up the latest pending payment
                if (!paymentId && user?.id) {
                    const { data: latestPayment } = await supabase
                        .from('subscription_payments')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('status', 'pending')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()

                    if (latestPayment) paymentId = latestPayment.id
                }

                if (!paymentId) {
                    setLoading(false)
                    showToast('Payment completed, but we could not verify the ID.', 'warning')
                    return
                }

                // 2. Fetch the payment record
                const { data: payment, error } = await supabase
                    .from('subscription_payments')
                    .select('*')
                    .eq('id', paymentId)
                    .single()

                if (error) throw error
                if (!payment) throw new Error('Payment record not found')

                // 3. Mark payment as success and set expiry date if it's premium
                if (payment.status === 'pending') {
                    const updateData = { status: 'success' }

                    // If it's a PREMIUM payment, add 30 days to the expiration date
                    if (payment.type === 'premium') {
                        const expiryDate = new Date()
                        expiryDate.setDate(expiryDate.getDate() + 30)
                        updateData.expires_at = expiryDate.toISOString()
                    }

                    await supabase
                        .from('subscription_payments')
                        .update(updateData)
                        .eq('id', paymentId)
                }

                // 4. Check if it was a premium subscription
                if (payment?.type === 'premium') {
                    setIsPremium(true)
                    showToast('Premium subscription activated! You now have full access for 30 days.', 'success')
                }

                // 5. If it was a community setup fee, activate the community
                if (payment?.type === 'community' && payment?.amount === 100) {
                    await supabase
                        .from('communities')
                        .update({ setup_fee_paid: true, setup_fee_paid_at: new Date().toISOString() })
                        .eq('id', payment.community_id)
                    
                    setCommunityId(payment.community_id)
                    showToast('Community created! Setup fee paid.', 'success')
                }

            } catch (error) {
                console.error('Error verifying payment:', error)
                showToast('Payment verification failed.', 'error')
            } finally {
                setLoading(false)
            }
        }

        if (user) verifyPayment()
        else {
            setLoading(false)
            showToast('Please log in to verify your payment.', 'warning')
        }
    }, [user, showToast])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">Processing Payment...</h2>
                    <p className="text-gray-500 mt-2">Please wait while we verify your payment.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-green-600" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800">
                    {isPremium ? 'Premium Subscription Active!' : 'Payment Successful!'}
                </h1>
                
                <p className="text-gray-500 mt-2">
                    {isPremium 
                        ? 'You now have full access to the Leaderboard and AI predictions for 30 days.'
                        : 'Thank you for your payment!'
                    }
                </p>

                <div className="flex gap-3 mt-6">
                    <Link 
                        to={communityId ? `/community/${communityId}` : '/'}
                        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                        {communityId ? 'Go to Community' : 'Go Home'}
                        <ArrowRight size={18} />
                    </Link>
                    
                    <Link 
                        to="/"
                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
                    >
                        <Home size={18} />
                        Home
                    </Link>
                </div>
            </div>
        </div>
    )
}