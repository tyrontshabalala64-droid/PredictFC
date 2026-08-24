 import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopNav from './TopNav'

export default function Layout() {
    const currentYear = new Date().getFullYear()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 transition-colors duration-200">
            <TopNav />
            <div className="max-w-7xl mx-auto px-4 py-6">
                <Outlet />
            </div>
            
            {/* Footer with Legal Links */}
            <div className="max-w-7xl mx-auto px-4 pb-4">
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © {currentYear} PredictFC. All rights reserved.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                        <Link 
                            to="/privacy" 
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                            Privacy Policy
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <Link 
                            to="/terms" 
                            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                            Terms of Service
                        </Link>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            v1.0.0
                        </span>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    )
}