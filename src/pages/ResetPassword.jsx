import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const { showToast } = useToast()
    const navigate = useNavigate()

    // Check if we have a valid session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // No valid session, redirect to login
                showToast('Invalid or expired reset link. Please try again.', 'error')
                navigate('/login')
            }
        }
        checkSession()
    }, [navigate, showToast])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validate passwords
        if (!password || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)
            showToast('Password updated successfully! ✅', 'success')

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login')
            }, 3000)

        } catch (error) {
            console.error('Reset password error:', error)
            setError(error.message || 'Failed to reset password')
            showToast(error.message || 'Failed to reset password', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔐</div>
                    <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
                    <p className="text-gray-500 mt-1">Enter your new password</p>
                </div>

                {success ? (
                    <div className="text-center py-4">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <p className="text-gray-700 font-medium text-lg">Password Updated!</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Your password has been changed successfully.
                        </p>
                        <p className="text-gray-400 text-xs mt-4">
                            Redirecting to login...
                        </p>
                        <Link 
                            to="/login"
                            className="inline-block mt-4 text-gray-800 font-semibold hover:underline"
                        >
                            Go to Login →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800"
                                    placeholder="Min 6 characters"
                                    required
                                    minLength="6"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800"
                                    placeholder="Confirm your new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>

                        <p className="text-center text-gray-400 text-xs mt-4">
                            Make sure your new password is secure and unique.
                        </p>
                    </form>
                )}
            </div>
        </div>
    )
}