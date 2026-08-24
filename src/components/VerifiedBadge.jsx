 import React from 'react'

export default function VerifiedBadge({ size = 'md', showTooltip = false }) {
    const sizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-6 h-6'
    }

    const sizeClass = sizes[size] || sizes.md

    return (
        <div className="inline-flex items-center group relative">
            <svg 
                className={`${sizeClass} text-blue-500 fill-blue-500`} 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))' }}
            >
                <circle cx="12" cy="12" r="12" fill="currentColor" />
                <path 
                    d="M17.5 7.5L10 15L6.5 11.5L7.5 10.5L10 13L16.5 6.5L17.5 7.5Z" 
                    fill="white" 
                />
            </svg>
            {showTooltip && (
                <span className="ml-1 text-xs text-blue-500 font-medium">Verified</span>
            )}
            {!showTooltip && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Verified Account
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    )
}