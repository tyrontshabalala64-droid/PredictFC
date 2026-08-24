 import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Scale } from 'lucide-react'

export default function Terms() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 pb-20 transition-colors duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                >
                    <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Scale size={24} /> Terms of Service
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-200">
                {/* ✅ PASTE YOUR TERMLY TERMS OF SERVICE CONTENT HERE */}
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                        __html: `
                            <!-- Paste your Terms of Service HTML from Termly here -->
                            <h1>Terms of Service</h1>
                            <p><strong>Last updated:</strong> August 07, 2026</p>
                            
                            <h2>1. Acceptance of Terms</h2>
                            <p>By using PredictFC, you agree to these Terms of Service. If you do not agree, please do not use our services.</p>
                            
                            <h2>2. User Accounts</h2>
                            <p>You are responsible for maintaining the security of your account. You must provide accurate information when creating your account.</p>
                            
                            <h2>3. User Content</h2>
                            <p>You retain ownership of content you post. By posting, you grant us permission to display and share your content within the app.</p>
                            
                            <h2>4. Prohibited Conduct</h2>
                            <p>You may not:</p>
                            <ul>
                                <li>Post false or misleading predictions</li>
                                <li>Harass or abuse other users</li>
                                <li>Create multiple accounts</li>
                                <li>Attempt to manipulate the prediction system</li>
                            </ul>
                            
                            <h2>5. Payments and Subscriptions</h2>
                            <p>Some communities require payment to join. Payments are processed through PayFast. You agree to pay all fees associated with your account.</p>
                            
                            <h2>6. Termination</h2>
                            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
                            
                            <h2>7. Contact Us</h2>
                            <p>Email: support@predictfc.com</p>
                        `
                    }}
                />
            </div>
        </div>
    )
}