import React from 'react'
import { Link } from 'react-router-dom'

export default function PaymentCancel() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-gray-800">Payment Cancelled</h1>
                <p className="text-gray-500 mt-2">You cancelled the payment process.</p>
                <Link 
                    to="/community"
                    className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                    Return to Communities
                </Link>
            </div>
        </div>
    )
}