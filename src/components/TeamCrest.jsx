 // src/components/TeamCrest.jsx
import React from 'react'

export default function TeamCrest({ team, size = 'md' }) {
    if (!team) return null
    
    const sizeClasses = {
        sm: 'w-6 h-6 text-[8px]',
        md: 'w-8 h-8 text-[10px]',
        lg: 'w-10 h-10 text-xs',
        xl: 'w-12 h-12 text-sm'
    }
    
    const sizeClass = sizeClasses[size] || sizeClasses.md
    
    // If we have a real image URL
    if (team.crest && typeof team.crest === 'string' && team.crest.startsWith('http')) {
        return (
            <img 
                src={team.crest} 
                alt={team.name} 
                className={`${sizeClass} object-contain rounded-full`}
                onError={(e) => {
                    e.target.style.display = 'none'
                }}
            />
        )
    }
    
    // If we have color data (PSL teams)
    if (team.crest && typeof team.crest === 'object' && team.crest.bgColor) {
        const { bgColor, textColor, initials } = team.crest
        return (
            <div 
                className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
                style={{ 
                    backgroundColor: bgColor || '#6B7280', 
                    color: textColor || '#FFFFFF',
                }}
            >
                {initials || team.name?.substring(0, 2).toUpperCase() || '??'}
            </div>
        )
    }
    
    // Default fallback
    return (
        <div className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 flex-shrink-0`}>
            {team.name?.substring(0, 2).toUpperCase() || '??'}
        </div>
    )
}