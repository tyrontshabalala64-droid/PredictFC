 import React from 'react'

export default function BouncingLoader({ size = 'md', color = 'green', text = '' }) {
    const sizes = {
        sm: 'w-2 h-2 gap-1',
        md: 'w-3 h-3 gap-1.5',
        lg: 'w-4 h-4 gap-2',
        xl: 'w-5 h-5 gap-2.5'
    }

    const colors = {
        green: 'bg-green-600',
        blue: 'bg-blue-600',
        gray: 'bg-gray-600',
        white: 'bg-white',
        red: 'bg-red-600',
        yellow: 'bg-yellow-600'
    }

    const dotSize = sizes[size] || sizes.md
    const dotColor = colors[color] || colors.green

    const containerSize = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className={`flex items-center justify-center ${containerSize[size] || containerSize.md}`}>
                <div className={`flex items-center ${dotSize}`}>
                    <div className={`${dotColor} rounded-full animate-bounce-delay-1`} style={{ width: '100%', height: '100%' }}></div>
                    <div className={`${dotColor} rounded-full animate-bounce-delay-2`} style={{ width: '100%', height: '100%' }}></div>
                    <div className={`${dotColor} rounded-full animate-bounce-delay-3`} style={{ width: '100%', height: '100%' }}></div>
                </div>
            </div>
            {text && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    )
}