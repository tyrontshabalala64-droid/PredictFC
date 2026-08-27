 import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'  // Fixed: ../../
import { useToast } from '../../contexts/ToastContext'  // Fixed: ../../
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function Register() {
    const [form, setForm] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        label: 'Weak',
        color: 'bg-red-500'
    })
    const { signUp } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const checkPasswordStrength = (password) => {
        let score = 0
        if (password.length >= 6) score++
        if (password.length >= 10) score++
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
        if (/\d/.test(password)) score++
        if (/[^a-zA-Z0-9]/.test(password)) score++

        const levels = [
            { score: 0, label: 'Very Weak', color: 'bg-red-500' },
            { score: 1, label: 'Weak', color: 'bg-orange-500' },
            { score: 2, label: 'Fair', color: 'bg-yellow-500' },
            { score: 3, label: 'Good', color: 'bg-blue-500' },
            { score: 4, label: 'Strong', color: 'bg-green-500' },
            { score: 5, label: 'Very Strong', color: 'bg-green-600' }
        ]

        const level = levels.find(l => l.score === score) || levels[0]
        setPasswordStrength({
            score,
            label: level.label,
            color: level.color
        })
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        
        if (name === 'password') {
            checkPasswordStrength(value)
        }
    }

    const validatePhone = (phone) => {
        // South African phone number validation
        const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/
        return phoneRegex.test(phone)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validate username
        if (form.username.length < 3) {
            setError('Username must be at least 3 characters')
            return
        }

        // Validate email
        if (!form.email.includes('@')) {
            setError('Please enter a valid email address')
            return
        }

        // Validate phone (optional but if provided must be valid)
        if (form.phone && !validatePhone(form.phone)) {
            setError('Please enter a valid South African phone number (e.g. 0712345678 or +27712345678)')
            return
        }

        // Validate password
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await signUp(
                form.email,
                form.password,
                form.username,
                form.fullName || form.username,
                form.phone || null
            )
            showToast('Account created! Please check your email to confirm.', 'success')
            navigate('/login')
        } catch (error) {
            console.error('Registration error:', error)
            if (error.message.includes('User already registered')) {
                setError('An account with this email already exists. Please login.')
            } else {
                setError(error.message || 'Failed to create account')
            }
            showToast(error.message || 'Failed to create account', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">⚽</div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Create Account</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Join PredictFC today</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Username *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="johndoe"
                            required
                            minLength="3"
                        />
                    </div>

                    {/* Full Name */}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Phone (Optional)
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="0712345678"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">South African number (e.g. 0712345678)</p>
                    </div>

                    {/* Password */}
                    <div className="mb-2">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                placeholder="Min 6 characters"
                                required
                                minLength="6"
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

                    {/* Password Strength Meter */}
                    {form.password.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {passwordStrength.label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Use 6+ characters with letters, numbers & symbols
                            </p>
                        </div>
                    )}

                    {/* Confirm Password */}
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                            Confirm Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                placeholder="Confirm your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <XCircle size={12} /> Passwords do not match
                            </p>
                        )}
                        {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 6 && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Passwords match
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-800 dark:bg-white text-white dark:text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-gray-800 dark:text-white font-semibold hover:underline">
                        Sign In
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