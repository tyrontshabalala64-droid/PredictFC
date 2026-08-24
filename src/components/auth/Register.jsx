 import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader } from 'lucide-react'
import { isRegistrationAllowed, getCachedSettings } from '../../services/settingsService'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [registrationAllowed, setRegistrationAllowed] = useState(true)
    const [checkingRegistration, setCheckingRegistration] = useState(true)
    const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '', color: '' })
    const { signUp } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const settings = getCachedSettings()
    const allowPhoneNumbers = settings?.allow_phone_numbers !== false
    const minPasswordLength = settings?.min_password_length || 6

    useEffect(() => {
        const checkRegistration = async () => {
            try {
                const allowed = await isRegistrationAllowed()
                setRegistrationAllowed(allowed)
                if (!allowed) {
                    setError('Registration is currently disabled. Please try again later.')
                }
            } catch (error) {
                console.error('Error checking registration setting:', error)
                setRegistrationAllowed(true)
            } finally {
                setCheckingRegistration(false)
            }
        }
        checkRegistration()
    }, [])

    const checkPasswordStrength = (pass) => {
        let strength = 0
        if (pass.length >= minPasswordLength) strength += 1
        if (pass.length >= 10) strength += 1
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 1
        if (/[0-9]/.test(pass)) strength += 1
        if (/[^a-zA-Z0-9]/.test(pass)) strength += 1
        
        const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
        const colors = ['#ef4444', '#f59e0b', '#fbbf24', '#34d399', '#22c55e']
        const level = Math.min(strength, 4)
        
        setPasswordStrength({
            level: strength,
            text: pass ? levels[level] : '',
            color: pass ? colors[level] : '#e5e7eb'
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!registrationAllowed) {
            setError('Registration is currently disabled. Please try again later.')
            showToast('Registration is currently disabled', 'error')
            return
        }

        setLoading(true)

        const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/
        if (phone && !phoneRegex.test(phone)) {
            setError('Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)')
            showToast('Invalid phone number', 'error')
            setLoading(false)
            return
        }

        try {
            await signUp(email, password, username, fullName, phone)
            showToast('Account created successfully! Please check your email to confirm.', 'success')
            navigate('/login')
        } catch (err) {
            setError(err.message || 'Failed to sign up')
            showToast(err.message || 'Failed to sign up', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (checkingRegistration) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                </div>
            </div>
        )
    }

    if (!registrationAllowed) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Registration Disabled</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        New user registration is currently disabled. Please check back later.
                    </p>
                    <Link 
                        to="/login"
                        className="inline-block mt-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white underline"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full transition-colors duration-200">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">⚽</div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">PredictFC</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Join the prediction community</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Username *</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="footballfan123"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {allowPhoneNumbers && (
                        <div className="mb-3">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                placeholder="0821234567"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">South African number (e.g., 0821234567)</p>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Password *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    checkPasswordStrength(e.target.value)
                                }}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                placeholder="Min 6 characters"
                                required
                                minLength={minPasswordLength}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {password && (
                            <div className="mt-2">
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full transition-all duration-300 rounded-full"
                                        style={{ 
                                            width: `${(passwordStrength.level / 5) * 100}%`,
                                            background: passwordStrength.color 
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {passwordStrength.text}
                                </span>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">At least {minPasswordLength} characters</p>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                required
                                className="w-5 h-5 accent-gray-800 dark:accent-gray-400 mt-0.5"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                I agree to the <Link to="/terms" className="text-gray-800 dark:text-white font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-gray-800 dark:text-white font-semibold hover:underline">Privacy Policy</Link>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-800 dark:bg-white text-white dark:text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-gray-800 dark:text-white font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                    <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-2">
                        Forgot your password?{' '}
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-gray-500 dark:text-gray-400 hover:underline"
                        >
                            Reset it here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}