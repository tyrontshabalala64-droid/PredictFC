 import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resetLoading, setResetLoading] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetSent, setResetSent] = useState(false)
    const { signIn } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // ✅ Email normalization happens inside signIn
            await signIn(email, password)
            showToast('Welcome back! 🎉', 'success')
            navigate('/')
        } catch (err) {
            console.error('Sign in error:', err)

            // ✅ Clean error handling
            if (err.message?.toLowerCase().includes('invalid login credentials') ||
                err.message?.toLowerCase().includes('invalid email') ||
                err.message?.toLowerCase().includes('user not found')) {
                setError('Invalid email or password. Please try again.')
                showToast('Invalid email or password', 'error')
            } else if (err.message?.toLowerCase().includes('banned')) {
                setError('Your account has been banned. Please contact support.')
                showToast('Account banned', 'error')
            } else {
                setError(err.message || 'Failed to sign in')
                showToast(err.message || 'Failed to sign in', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!resetEmail) {
            showToast('Please enter your email address', 'warning')
            return
        }

        // ✅ Normalize email for password reset
        const normalizedEmail = resetEmail.toLowerCase().trim()

        setResetLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            
            if (error) throw error
            
            setResetSent(true)
            showToast('Password reset email sent! 📧 Check your inbox.', 'success')
            
            setTimeout(() => {
                setShowResetModal(false)
                setResetSent(false)
                setResetEmail('')
            }, 3000)
            
        } catch (error) {
            console.error('Reset password error:', error)
            showToast(error.message || 'Failed to send reset email', 'error')
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">⚽</div>
                    <h1 className="text-3xl font-bold text-gray-800">PredictFC</h1>
                    <p className="text-gray-500 mt-1">Sign in to predict and win</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition bg-white text-gray-800"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition bg-white text-gray-800"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex justify-end mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setResetEmail(email || '')
                                setShowResetModal(true)
                                setResetSent(false)
                            }}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-gray-800 font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
                            <button 
                                onClick={() => {
                                    setShowResetModal(false)
                                    setResetSent(false)
                                    setResetEmail('')
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {resetSent ? (
                            <div className="text-center py-6">
                                <div className="text-5xl mb-4">📧</div>
                                <p className="text-gray-700 font-medium">Check your email</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    We've sent a password reset link to <strong>{resetEmail}</strong>
                                </p>
                                <p className="text-gray-400 text-xs mt-4">
                                    The link will expire in 1 hour.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <p className="text-gray-500 text-sm mb-4">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
                                >
                                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}