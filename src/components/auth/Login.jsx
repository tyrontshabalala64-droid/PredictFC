 import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'  // Fixed: ../../
import { useToast } from '../../contexts/ToastContext'  // Fixed: ../../
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [bannedMessage, setBannedMessage] = useState('')
    const { signIn } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        // Check if user was redirected due to ban
        const params = new URLSearchParams(location.search)
        if (params.get('banned') === 'true') {
            setBannedMessage('Your account has been banned. Please contact support.')
        }
    }, [location])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setBannedMessage('')
        
        if (!email || !password) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            await signIn(email, password)
            showToast('Welcome back!', 'success')
            navigate('/')
        } catch (error) {
            console.error('Login error:', error)
            if (error.message.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please try again.')
            } else if (error.message.includes('Email not confirmed')) {
                setError('Please confirm your email before logging in.')
            } else {
                setError(error.message || 'Failed to sign in')
            }
            showToast(error.message || 'Failed to sign in', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">⚽</div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">PredictFC</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
                </div>

                {bannedMessage && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{bannedMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <Link 
                            to="/reset-password" 
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-800 dark:bg-white text-white dark:text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-gray-800 dark:text-white font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <Link 
                        to="/" 
                        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}