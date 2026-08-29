// src/components/messages/UserSearch.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, User, X, Loader } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function UserSearch({ onSelect, onClose }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const searchRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults([])
            return
        }

        const searchUsers = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url, is_verified')
                    .neq('id', user?.id)
                    .ilike('username', `%${query}%`)
                    .limit(10)

                if (error) throw error
                setResults(data || [])
                setShowResults(true)
            } catch (error) {
                console.error('Error searching users:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [query, user])

    const handleSelect = (userId) => {
        setQuery('')
        setResults([])
        setShowResults(false)
        if (onSelect) onSelect(userId)
        navigate(`/inbox?user=${userId}`)
    }

    return (
        <div ref={searchRef} className="relative">
            <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    placeholder="Search for users..."
                    className="w-full px-4 py-2 pl-10 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('')
                            setResults([])
                            setShowResults(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-72 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader size={20} className="animate-spin text-gray-400" />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            No users found
                        </div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => handleSelect(result.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 text-left"
                            >
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {result.avatar_url ? (
                                        <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white text-sm">
                                        {result.full_name || result.username}
                                        {result.is_verified && <span className="ml-1 text-blue-500">✓</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">@{result.username}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}