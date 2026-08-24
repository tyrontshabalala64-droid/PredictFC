 import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp,
  Calendar,
  Heart,
  Home,
  Plane,
  Minus,
  Sparkles,
  Clock,
  Loader,
  Search,
  Globe,
  Flag,
  Users,
  CheckCircle
} from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import { checkUserSubscription } from '../services/subscriptionService'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { generatePrediction } from '../services/predictionEngine'

export default function Leaderboard() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [predictions, setPredictions] = useState([])
    const [leaderboardUsers, setLeaderboardUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeFrame, setTimeFrame] = useState('today')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [checking, setChecking] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // ✅ Check Subscription Status
    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                navigate('/login')
                return
            }
            
            const subscribed = await checkUserSubscription(user.id)
            setIsSubscribed(subscribed)
            setChecking(false)

            if (!subscribed && window.location.pathname !== '/subscribe') {
                navigate('/subscribe')
            }
        }
        checkAccess()
    }, [user, navigate])

    // ✅ Load Predictions (10 matches per league, daily stable)
    const loadPredictions = useCallback(async () => {
        try {
            const leagueIds = Object.values(COMPETITIONS)
            const allPredictions = []

            for (const leagueId of leagueIds) {
                try {
                    const { matches, standingsMap } = await getTodaysMatches(leagueId)
                    const formattedMatches = matches.map(match => formatMatch(match))

                    const matchesWithPredictions = formattedMatches.map(match => {
                        const homeStats = standingsMap[match.homeTeam?.id]
                        const awayStats = standingsMap[match.awayTeam?.id]
                        
                        // ✅ NEW: Pass matchId, not homeTeam/awayTeam
                        const prediction = generatePrediction(
                            match.id || match.matchId, // The match ID as the seed
                            homeStats,
                            awayStats
                        )

                        return { ...match, prediction }
                    })

                    allPredictions.push(...matchesWithPredictions.slice(0, 10))
                } catch (error) {
                    console.error(`Error loading league ${leagueId}:`, error)
                }
            }

            setPredictions(allPredictions)
        } catch (error) {
            console.error('Error loading predictions:', error)
            showToast('Failed to load predictions', 'error')
        }
    }, [showToast])

    // ✅ Load Leaderboard (Top 10 users by Most Likes on their predictions)
    const loadLeaderboard = useCallback(async () => {
        try {
            const now = new Date()
            let startDate = new Date()

            if (timeFrame === 'today') {
                startDate.setHours(0, 0, 0, 0)
            } else if (timeFrame === 'week') {
                startDate.setDate(now.getDate() - 7)
            } else if (timeFrame === 'month') {
                startDate.setMonth(now.getMonth() - 1)
            }

            const startDateStr = startDate.toISOString()
            const endDateStr = now.toISOString()

            const { data, error } = await supabase
                .from('public_predictions')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, points, is_verified)
                `)
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr)
                .order('likes_count', { ascending: false })
                .limit(10)

            if (error) throw error

            setLeaderboardUsers(data || [])
        } catch (error) {
            console.error('Error loading leaderboard:', error)
        }
    }, [timeFrame])

    // ✅ Load everything when user is subscribed
    useEffect(() => {
        if (isSubscribed) {
            const loadAll = async () => {
                setLoading(true)
                await Promise.all([
                    loadPredictions(),
                    loadLeaderboard()
                ])
                setLoading(false)
            }
            loadAll()
        }
    }, [isSubscribed, loadPredictions, loadLeaderboard, timeFrame])

    // Filter predictions by search query
    const filteredPredictions = predictions.filter(match => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase().trim()
        const homeName = match.homeTeam?.name?.toLowerCase() || ''
        const awayName = match.awayTeam?.name?.toLowerCase() || ''
        const leagueName = match.league?.toLowerCase() || ''
        return homeName.includes(query) || awayName.includes(query) || leagueName.includes(query)
    })

    // Group predictions by league
    const groupedPredictions = filteredPredictions.reduce((acc, match) => {
        const league = match.league || 'Unknown League'
        if (!acc[league]) {
            acc[league] = []
        }
        acc[league].push(match)
        return acc
    }, {})

    // While checking subscription
    if (checking) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                    <div className="text-xl text-gray-500 mt-2">Checking subscription...</div>
                </div>
            </div>
        )
    }

    if (!isSubscribed) return null

    // ✅ Render Prediction Card
    const renderPredictionCard = (match) => {
        const homeName = match.homeTeam?.name || 'Unknown'
        const awayName = match.awayTeam?.name || 'Unknown'
        const homeCrest = match.homeTeam?.crest
        const awayCrest = match.awayTeam?.crest
        const prediction = match.prediction || {}

        return (
            <div key={match.id} className="bg-white rounded-xl shadow-md p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            {homeCrest ? (
                                <img src={homeCrest} alt={homeName} className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                    {homeName.charAt(0)}
                                </div>
                            )}
                            <span className="font-bold text-gray-800 text-sm">{homeName}</span>
                        </div>
                        <span className="text-gray-400 text-xs">vs</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm">{awayName}</span>
                            {awayCrest ? (
                                <img src={awayCrest} alt={awayName} className="w-8 h-8 object-contain" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                    {awayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={14} /> 
                        {match.kickoff ? new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                </div>

                {/* Prediction Card */}
                <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-gray-800">AI Predicted Tips</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2 border border-green-200">
                            <div className="text-xs text-gray-500">Match Result</div>
                            <div className="font-bold text-green-700 text-sm mt-1">{prediction.matchResult || 'Draw'}</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-green-200">
                            <div className="text-xs text-gray-500">Over/Under</div>
                            <div className="font-bold text-green-700 text-sm mt-1">{prediction.overUnder || 'Over 2.5'}</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-green-200">
                            <div className="text-xs text-gray-500">BTTS</div>
                            <div className="font-bold text-green-700 text-sm mt-1">{prediction.btts || 'No'}</div>
                        </div>
                    </div>
                    <div className="mt-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prediction.confidence === 'High' 
                                ? 'bg-green-500 text-white' 
                                : prediction.confidence === 'Medium' 
                                    ? 'bg-yellow-500 text-white' 
                                    : 'bg-gray-400 text-white'
                        }`}>
                            {prediction.confidence || 'Low'} Confidence
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    // ✅ Render Leaderboard Item (Clickable - goes to Feed post)
    const renderLeaderboardItem = (prediction, index) => {
        const data = prediction.prediction_data || {}
        const isOwn = user?.id === prediction.user_id
        const medal = index === 0 ? <Crown className="w-8 h-8 text-yellow-500" /> : index === 1 ? <Medal className="w-8 h-8 text-gray-400" /> : index === 2 ? <Medal className="w-8 h-8 text-amber-600" /> : <span className="text-gray-400 font-bold">#{index + 1}</span>

        return (
            <Link
                to={`/feed?highlight=${prediction.id}`}
                key={prediction.id} 
                className={`bg-white rounded-xl shadow-md p-3 mb-2 flex items-center gap-3 hover:shadow-lg transition ${
                    isOwn ? 'border-2 border-green-500' : ''
                }`}
            >
                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                    {medal}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {prediction.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm flex items-center gap-1 truncate">
                                {prediction.profiles?.full_name || prediction.profiles?.username || 'Unknown'}
                                {prediction.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                {isOwn && <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded-full">You</span>}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                                {data.result || 'Draw'} • {data.overUnder || 'Over 2.5'} • {data.btts || 'No'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-red-500 font-bold text-sm flex items-center gap-1 justify-end">
                        <Heart size={14} fill="currentColor" /> {prediction.likes_count || 0}
                    </div>
                    <div className="text-xs text-gray-400">{new Date(prediction.created_at).toLocaleDateString()}</div>
                </div>
            </Link>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles size={24} className="text-green-600" /> Premium Predictions & Leaderboard
                </h1>
                <p className="text-gray-500">AI-powered predictions + Top 10 most liked predictions</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ================= LEFT SIDEBAR: LEADERBOARD (SCROLLABLE) ================= */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-md p-4 sticky top-20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" /> Leaderboard
                            </h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setTimeFrame('today')}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        timeFrame === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setTimeFrame('week')}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        timeFrame === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setTimeFrame('month')}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                        timeFrame === 'month' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Month
                                </button>
                            </div>
                        </div>

                        {/* SCROLLABLE LIST */}
                        <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {leaderboardUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">No predictions yet</p>
                                </div>
                            ) : (
                                <div>
                                    {leaderboardUsers.map(renderLeaderboardItem)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================= MAIN AREA: AI PREDICTIONS ================= */}
                <div className="flex-1">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a team or league..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                            <div className="text-gray-400 mt-2">Loading predictions...</div>
                        </div>
                    ) : filteredPredictions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md">
                            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">{searchQuery ? `No matches found for "${searchQuery}"` : 'No predictions available'}</p>
                            <p className="text-sm text-gray-400">Check back soon for today's matches!</p>
                        </div>
                    ) : (
                        Object.entries(groupedPredictions).map(([league, matches]) => (
                            <div key={league} className="mb-8">
                                {/* League Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Flag size={20} className="text-green-600" />
                                    <h2 className="text-lg font-bold text-gray-800">{league}</h2>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{matches.length} matches</span>
                                </div>

                                {/* Match Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {matches.map(renderPredictionCard)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}