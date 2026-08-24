import React from 'react'
import { Wrench, Clock } from 'lucide-react'

export default function MaintenanceMode() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench size={40} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Maintenance Mode
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    We're currently performing scheduled maintenance. Please check back soon.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <Clock size={16} />
                    <span>We'll be back shortly</span>
                </div>
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        If you need immediate assistance, please contact support.
                    </p>
                </div>
            </div>
        </div>
    )
}