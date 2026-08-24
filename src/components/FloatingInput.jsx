import React, { useState } from 'react'

export default function FloatingInput({ label, type = 'text', value, onChange, required, ...props }) {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = value && value.length > 0

    return (
        <div className="relative mb-4">
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full px-4 pt-5 pb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${isFocused || hasValue ? 'border-green-500' : ''}`}
                required={required}
                {...props}
            />
            <label className={`absolute left-4 transition-all duration-200 ${isFocused || hasValue ? 'text-xs text-green-600 top-1' : 'text-gray-500 top-3'}`}>
                {label}
            </label>
        </div>
    )
}