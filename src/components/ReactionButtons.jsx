 import React from 'react'
import { Heart, Laugh, Meh, Frown, Angry } from 'lucide-react'

const REACTIONS = [
    { type: 'like', icon: Heart, label: 'Like' },
    { type: 'laugh', icon: Laugh, label: 'Haha' },
    { type: 'wow', icon: Meh, label: 'Wow' },
    { type: 'sad', icon: Frown, label: 'Sad' },
    { type: 'angry', icon: Angry, label: 'Angry' }
]

export default function ReactionButtons({ onReact, userReaction, reactions }) {
    // Always use defaults if reactions is undefined
    const safeReactions = {
        like: 0,
        dislike: 0,
        laugh: 0,
        wow: 0,
        sad: 0,
        angry: 0
    }

    // Only merge if reactions exists and is an object
    const finalReactions = (reactions && typeof reactions === 'object') 
        ? { ...safeReactions, ...reactions }
        : safeReactions

    return (
        <div className="flex items-center justify-around gap-1">
            {REACTIONS.map(({ type, icon: Icon, label }) => {
                const count = finalReactions[type] || 0
                const isActive = userReaction === type
                
                return (
                    <button
                        key={type}
                        onClick={() => onReact && onReact(type)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition ${
                            isActive
                                ? 'bg-green-100 text-green-700'
                                : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    >
                        <Icon size={16} />
                        <span>{count}</span>
                        <span className="hidden md:inline">{label}</span>
                    </button>
                )
            })}
        </div>
    )
}