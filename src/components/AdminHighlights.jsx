 // src/components/AdminHighlights.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
    ChevronRight,
    Clock,
    Sparkles,
    Megaphone,
    Users,
    ChevronLeft,
    Flame
} from 'lucide-react'
import { getAdminHighlights, LEAGUE_INFO } from '../services/adminHighlightService'

export default function AdminHighlights() {
    const [highlights, setHighlights] = useState([])
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef(null)

    useEffect(() => {
        loadHighlights()
    }, [])

    const loadHighlights = async () => {
        setLoading(true)
        try {
            const data = await getAdminHighlights(10)
            const unique = data.filter((item, index, self) => 
                index === self.findIndex((t) => t.id === item.id)
            )
            setHighlights(unique)
        } catch (error) {
            console.error('Error loading highlights:', error)
        } finally {
            setLoading(false)
        }
    }

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 280
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-500" /> Highlights
                    </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2].map(i => (
                        <div key={i} className="min-w-[160px] bg-white rounded-xl shadow-sm p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
                            <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (highlights.length === 0) {
        return null
    }

    // Animated border glow component - Purple/Green theme
    const GlowBorder = ({ children }) => (
        <div className="relative rounded-xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-emerald-400 to-purple-500 rounded-xl opacity-60 blur-sm animate-gradient-xy"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-emerald-400 to-purple-500 rounded-xl opacity-30 blur-md animate-gradient-xy"></div>
            <div className="relative rounded-xl overflow-hidden">
                {children}
            </div>
        </div>
    )

    // Render fixture card - MATCHES TRENDING SIZE
    const renderFixtureCard = (highlight) => {
        const leagueInfo = LEAGUE_INFO[highlight.league]
        const matchData = highlight.match_data

        return (
            <div className="min-w-[160px] max-w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                {highlights.length <= 2 ? (
                    <GlowBorder>
                        <Link
                            to={highlight.link_url || "/matches"}
                            className="block bg-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-lg">{leagueInfo?.icon || '🏆'}</span>
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {leagueInfo?.name || highlight.league || 'League'}
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-800">
                                {matchData ? (
                                    <>
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="truncate text-xs font-semibold">{matchData.homeTeam?.name || 'TBD'}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">VS</span>
                                            <span className="truncate text-xs font-semibold">{matchData.awayTeam?.name || 'TBD'}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {matchData.kickoff ? new Date(matchData.kickoff).toLocaleString() : 'TBD'}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs">{highlight.content}</span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Users size={10} /> PredictFC
                                </span>
                            </div>
                        </Link>
                    </GlowBorder>
                ) : (
                    <Link
                        to={highlight.link_url || "/matches"}
                        className="block bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-purple-300 p-4 hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-lg">{leagueInfo?.icon || '🏆'}</span>
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {leagueInfo?.name || highlight.league || 'League'}
                            </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                            {matchData ? (
                                <>
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="truncate text-xs font-semibold">{matchData.homeTeam?.name || 'TBD'}</span>
                                        <span className="text-[10px] text-gray-400 font-bold">VS</span>
                                        <span className="truncate text-xs font-semibold">{matchData.awayTeam?.name || 'TBD'}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock size={10} />
                                        {matchData.kickoff ? new Date(matchData.kickoff).toLocaleString() : 'TBD'}
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs">{highlight.content}</span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users size={10} /> PredictFC
                            </span>
                            <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                View <ChevronRight size={12} />
                            </span>
                        </div>
                    </Link>
                )}
            </div>
        )
    }

    // Render prediction card - MATCHES TRENDING SIZE
    const renderPredictionCard = (highlight) => {
        const predData = highlight.prediction_data

        return (
            <div className="min-w-[160px] max-w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                {highlights.length <= 2 ? (
                    <GlowBorder>
                        <Link
                            to={highlight.link_url || "/leaderboard"}
                            className="block bg-gradient-to-br from-blue-50/90 to-purple-50/90 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <Sparkles size={14} className="text-purple-500" />
                                <span className="text-[10px] font-medium text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                                    Premium
                                </span>
                            </div>
                            <div className="text-sm font-medium text-gray-800">
                                {predData ? (
                                    <>
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="truncate text-xs font-semibold">{predData.match?.homeTeam?.name || 'TBD'}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                predData.prediction?.matchResult === 'Home Win' ? 'bg-green-100 text-green-700' :
                                                predData.prediction?.matchResult === 'Away Win' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {predData.prediction?.matchResult || 'TBD'}
                                            </span>
                                            <span className="truncate text-xs font-semibold">{predData.match?.awayTeam?.name || 'TBD'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                                            <span className="text-blue-600 font-medium">⚡ {predData.prediction?.confidence || 0}%</span>
                                            {predData.prediction?.overUnder && (
                                                <span className="text-gray-500">{predData.prediction.overUnder}</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs">{highlight.content}</span>
                                )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Users size={10} /> PredictFC
                                </span>
                            </div>
                        </Link>
                    </GlowBorder>
                ) : (
                    <Link
                        to={highlight.link_url || "/leaderboard"}
                        className="block bg-gradient-to-br from-blue-50/90 to-purple-50/90 rounded-xl shadow-sm border-2 border-transparent hover:border-purple-300 p-4 hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles size={14} className="text-purple-500" />
                            <span className="text-[10px] font-medium text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                                Premium
                            </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                            {predData ? (
                                <>
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="truncate text-xs font-semibold">{predData.match?.homeTeam?.name || 'TBD'}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                            predData.prediction?.matchResult === 'Home Win' ? 'bg-green-100 text-green-700' :
                                            predData.prediction?.matchResult === 'Away Win' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {predData.prediction?.matchResult || 'TBD'}
                                        </span>
                                        <span className="truncate text-xs font-semibold">{predData.match?.awayTeam?.name || 'TBD'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                                        <span className="text-blue-600 font-medium">⚡ {predData.prediction?.confidence || 0}%</span>
                                        {predData.prediction?.overUnder && (
                                            <span className="text-gray-500">{predData.prediction.overUnder}</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs">{highlight.content}</span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users size={10} /> PredictFC
                            </span>
                            <span className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                View <ChevronRight size={12} />
                            </span>
                        </div>
                    </Link>
                )}
            </div>
        )
    }

    // Render custom card - MATCHES TRENDING SIZE
    const renderCustomCard = (highlight) => {
        return (
            <div className="min-w-[160px] max-w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                {highlights.length <= 2 ? (
                    <GlowBorder>
                        <Link
                            to={highlight.link_url || '#'}
                            className="block bg-gradient-to-br from-orange-50/90 to-yellow-50/90 rounded-xl p-4 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <Megaphone size={14} className="text-orange-500" />
                                <span className="text-[10px] font-medium text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                                    Announcement
                                </span>
                            </div>
                            <div className="text-sm">
                                <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                                    {highlight.title}
                                </div>
                                <div className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                    {highlight.content}
                                </div>
                                {highlight.image_url && (
                                    <div className="mt-1.5">
                                        <img src={highlight.image_url} alt="" className="w-full h-12 object-cover rounded-lg" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Users size={10} /> PredictFC
                                </span>
                            </div>
                        </Link>
                    </GlowBorder>
                ) : (
                    <Link
                        to={highlight.link_url || '#'}
                        className="block bg-gradient-to-br from-orange-50/90 to-yellow-50/90 rounded-xl shadow-sm border-2 border-transparent hover:border-orange-300 p-4 hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Megaphone size={14} className="text-orange-500" />
                            <span className="text-[10px] font-medium text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                                Announcement
                            </span>
                        </div>
                        <div className="text-sm">
                            <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                                {highlight.title}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                {highlight.content}
                            </div>
                            {highlight.image_url && (
                                <div className="mt-1.5">
                                    <img src={highlight.image_url} alt="" className="w-full h-12 object-cover rounded-lg" />
                                </div>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users size={10} /> PredictFC
                            </span>
                            <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                View <ChevronRight size={12} />
                            </span>
                        </div>
                    </Link>
                )}
            </div>
        )
    }

    const renderCard = (highlight) => {
        switch (highlight.content_type) {
            case 'fixture':
                return renderFixtureCard(highlight)
            case 'prediction':
                return renderPredictionCard(highlight)
            case 'custom':
                return renderCustomCard(highlight)
            default:
                return renderCustomCard(highlight)
        }
    }

    return (
        <div className="mb-6">
            {/* Header - Purple/Green theme - NO "See All" link */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-emerald-500 text-white px-3 py-1 rounded-full">
                    <Sparkles size={16} className="animate-pulse" />
                    <h2 className="text-sm font-bold tracking-wide">Highlights</h2>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                        {highlights.length}
                    </span>
                </div>
                <Flame size={14} className="text-orange-400 animate-pulse" />
            </div>

            <div className="relative">
                {/* Left Scroll Button */}
                {highlights.length > 2 && (
                    <button
                        onClick={() => scroll('left')}
                        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 border border-purple-200 hover:border-purple-400 transition-all"
                    >
                        <ChevronLeft size={14} className="text-purple-500" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
                    style={{ 
                        scrollSnapType: 'x mandatory',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {highlights.map((highlight) => (
                        <div key={highlight.id}>
                            {renderCard(highlight)}
                        </div>
                    ))}
                </div>

                {/* Right Scroll Button */}
                {highlights.length > 2 && (
                    <button
                        onClick={() => scroll('right')}
                        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 border border-purple-200 hover:border-purple-400 transition-all"
                    >
                        <ChevronRight size={14} className="text-purple-500" />
                    </button>
                )}
            </div>

            {/* Scroll indicator - mobile only */}
            {highlights.length > 2 && (
                <div className="flex justify-center gap-1.5 mt-2 md:hidden">
                    <div className="w-6 h-1 bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"></div>
                    <div className="w-1.5 h-1 bg-gray-300 rounded-full"></div>
                    <div className="w-1.5 h-1 bg-gray-300 rounded-full"></div>
                    <div className="w-1.5 h-1 bg-gray-300 rounded-full"></div>
                </div>
            )}
        </div>
    )
}