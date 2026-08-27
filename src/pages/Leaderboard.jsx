 import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  Sparkles,
  Clock,
  Loader,
  Search,
  Flag,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Shield
} from 'lucide-react'
import VerifiedBadge from '../components/VerifiedBadge'
import { checkUserSubscription } from '../services/subscriptionService'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { generatePrediction } from '../services/predictionEngine'
import { 
  getLeaderboard, 
  getUserLeaderboardPosition, 
  getUserPredictionStats 
} from '../services/leaderboardService'

// Cache key for daily predictions
const PREDICTIONS_CACHE_KEY = 'predictfc_daily_predictions'
const CACHE_DATE_KEY = 'predictfc_cache_date'

export default function Leaderboard() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [predictions, setPredictions] = useState([])
    const [allPredictions, setAllPredictions] = useState([]) // Store all predictions
    const [leaderboardUsers, setLeaderboardUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeFrame, setTimeFrame] = useState('today')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [checking, setChecking] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedPredictions, setExpandedPredictions] = useState({})
    const [selectedLeague, setSelectedLeague] = useState(COMPETITIONS.PREMIER_LEAGUE)
    const isFirstLoad = useRef(true)

    // League display names
    const leagueNames = {
        [COMPETITIONS.PREMIER_LEAGUE]: 'Premier League',
        [COMPETITIONS.LA_LIGA]: 'La Liga',
        [COMPETITIONS.BUNDESLIGA]: 'Bundesliga',
        [COMPETITIONS.SERIE_A]: 'Serie A',
        [COMPETITIONS.LIGUE_1]: 'Ligue 1',
        [COMPETITIONS.CHAMPIONS_LEAGUE]: 'Champions League',
        [COMPETITIONS.WORLD_CUP]: 'World Cup',
        [COMPETITIONS.EREDIVISIE]: 'Eredivisie',
        [COMPETITIONS.BRAZIL_SERIE_A]: 'Brasileirão',
        [COMPETITIONS.CHAMPIONSHIP]: 'Championship',
        [COMPETITIONS.PRIMEIRA_LIGA]: 'Primeira Liga',
        [COMPETITIONS.EUROPEAN_CHAMPIONSHIP]: 'European Championship',
    }

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

    // ✅ Check if predictions are cached for today
    const getTodayCache = () => {
        const today = new Date().toISOString().split('T')[0]
        const cachedData = localStorage.getItem(PREDICTIONS_CACHE_KEY)
        const cachedDateStr = localStorage.getItem(CACHE_DATE_KEY)
        
        if (cachedData && cachedDateStr === today) {
            try {
                return JSON.parse(cachedData)
            } catch (e) {
                return null
            }
        }
        return null
    }

    // ✅ Save predictions to cache
    const saveToCache = (data) => {
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem(PREDICTIONS_CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_DATE_KEY, today)
    }

    // ✅ Load Predictions - Only once per day
    const loadPredictions = useCallback(async () => {
        if (!isSubscribed) return
        
        // Check cache first
        const cached = getTodayCache()
        if (cached && cached.length > 0) {
            setAllPredictions(cached)
            // Filter by selected league
            filterPredictionsByLeague(cached, selectedLeague)
            setLoading(false)
            return
        }
        
        setLoading(true)
        try {
            // ✅ Only fetch matches for the SELECTED league
            const allPredictions = []
            const h2hCache = {}
            const now = new Date()

            // ✅ Fetch only the selected league
            const leagueId = selectedLeague
            try {
                const { matches, standingsMap } = await getTodaysMatches(leagueId)
                
                for (const match of matches) {
                    const matchDate = new Date(match.utcDate)
                    
                    // Skip matches that are already played or live
                    if (matchDate <= now) {
                        continue
                    }
                    
                    const formattedMatch = formatMatch(match)
                    
                    const homeStats = standingsMap[match.homeTeam?.id]
                    const awayStats = standingsMap[match.awayTeam?.id]
                    
                    const h2hKey = `${match.homeTeam?.id}-${match.awayTeam?.id}`
                    let h2hData = h2hCache[h2hKey]
                    
                    if (!h2hData) {
                        h2hData = await getHeadToHead(match.homeTeam?.id, match.awayTeam?.id)
                        h2hCache[h2hKey] = h2hData
                    }
                    
                    const prediction = generatePrediction(
                        match,
                        homeStats,
                        awayStats,
                        h2hData
                    )
                    
                    allPredictions.push({
                        ...formattedMatch,
                        prediction,
                        leagueId: leagueId // Store which league it belongs to
                    })
                }
            } catch (error) {
                console.error(`Error loading league ${leagueId}:`, error)
            }

            // Sort by kickoff time
            allPredictions.sort((a, b) => {
                const dateA = new Date(a.kickoff || 0)
                const dateB = new Date(b.kickoff || 0)
                return dateA - dateB
            })

            // Save to cache
            saveToCache(allPredictions)
            setAllPredictions(allPredictions)
            setPredictions(allPredictions)
            
        } catch (error) {
            console.error('Error loading predictions:', error)
            showToast('Failed to load predictions', 'error')
        } finally {
            setLoading(false)
        }
    }, [isSubscribed, selectedLeague, showToast])

    // ✅ Filter predictions by league
    const filterPredictionsByLeague = (predictionsData, leagueId) => {
        if (!predictionsData || predictionsData.length === 0) {
            setPredictions([])
            return
        }

        // Filter by league
        const filtered = predictionsData.filter(p => {
            // If the prediction has a leagueId, use it
            if (p.leagueId) {
                return p.leagueId === leagueId
            }
            // Otherwise, try to match by league name
            const leagueName = leagueNames[leagueId] || ''
            return p.league === leagueName
        })

        setPredictions(filtered)
    }

    // ✅ Load Leaderboard
    const loadLeaderboard = useCallback(async () => {
        if (!isSubscribed) return
        
        try {
            const data = await getLeaderboard(timeFrame, 10)
            setLeaderboardUsers(data)
        } catch (error) {
            console.error('Error loading leaderboard:', error)
        }
    }, [isSubscribed, timeFrame])

    // ✅ Load everything when user is subscribed or league changes
    useEffect(() => {
        if (isSubscribed) {
            const loadAll = async () => {
                await loadPredictions()
                await loadLeaderboard()
            }
            loadAll()
        }
    }, [isSubscribed, loadPredictions, loadLeaderboard])

    // ✅ Filter predictions when league changes
    useEffect(() => {
        if (allPredictions.length > 0) {
            filterPredictionsByLeague(allPredictions, selectedLeague)
        }
    }, [selectedLeague, allPredictions])

    // ✅ Toggle prediction expansion
    const toggleExpanded = (matchId) => {
        setExpandedPredictions(prev => ({
            ...prev,
            [matchId]: !prev[matchId]
        }))
    }

    // Filter predictions by search query
    const filteredPredictions = predictions.filter(match => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase().trim()
        const homeName = match.homeTeam?.name?.toLowerCase() || ''
        const awayName = match.awayTeam?.name?.toLowerCase() || ''
        const leagueName = match.league?.toLowerCase() || ''
        return homeName.includes(query) || awayName.includes(query) || leagueName.includes(query)
    })

    // Group predictions by league (now only one league should show)
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
        const pred = match.prediction
        const isExpanded = expandedPredictions[match.id]
        const homeName = match.homeTeam?.name || 'Unknown'
        const awayName = match.awayTeam?.name || 'Unknown'
        const homeCrest = match.homeTeam?.crest
        const awayCrest = match.awayTeam?.crest
        
        if (!pred) return null

        return (
            <div key={match.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition">
                {/* Match Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {homeCrest ? (
                                    <img src={homeCrest} alt={homeName} className="w-6 h-6 object-contain" />
                                ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
                                        {homeName.charAt(0)}
                                    </div>
                                )}
                                <span className="font-bold text-gray-800 text-sm truncate">{homeName}</span>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">vs</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm truncate">{awayName}</span>
                                {awayCrest ? (
                                    <img src={awayCrest} alt={awayName} className="w-6 h-6 object-contain" />
                                ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
                                        {awayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                            <Clock size={14} /> 
                            {match.kickoff ? new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <Flag size={12} /> {match.league || 'Unknown League'}
                    </div>
                </div>

                {/* Prediction Card */}
                <div className="p-4">
                    {/* Confidence Bar */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500" />
                            <span className="text-sm font-bold text-gray-800">Confidence</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        pred.confidence > 70 ? 'bg-green-500' :
                                        pred.confidence > 50 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                                    style={{ width: `${pred.confidence}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold">{pred.confidence}%</span>
                        </div>
                    </div>

                    {/* Match Result Probabilities */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                        <div className={`rounded-lg p-1.5 sm:p-2 text-center border ${
                            pred.matchResult === 'Home Win' 
                                ? 'bg-green-50 border-green-300' 
                                : 'border-gray-200'
                        }`}>
                            <div className="text-[10px] text-gray-500">Home</div>
                            <div className={`font-bold text-sm sm:text-base ${
                                pred.matchResult === 'Home Win' ? 'text-green-700' : 'text-gray-700'
                            }`}>
                                {pred.probabilities.home}%
                            </div>
                        </div>
                        <div className={`rounded-lg p-1.5 sm:p-2 text-center border ${
                            pred.matchResult === 'Draw' 
                                ? 'bg-yellow-50 border-yellow-300' 
                                : 'border-gray-200'
                        }`}>
                            <div className="text-[10px] text-gray-500">Draw</div>
                            <div className={`font-bold text-sm sm:text-base ${
                                pred.matchResult === 'Draw' ? 'text-yellow-700' : 'text-gray-700'
                            }`}>
                                {pred.probabilities.draw}%
                            </div>
                        </div>
                        <div className={`rounded-lg p-1.5 sm:p-2 text-center border ${
                            pred.matchResult === 'Away Win' 
                                ? 'bg-red-50 border-red-300' 
                                : 'border-gray-200'
                        }`}>
                            <div className="text-[10px] text-gray-500">Away</div>
                            <div className={`font-bold text-sm sm:text-base ${
                                pred.matchResult === 'Away Win' ? 'text-red-700' : 'text-gray-700'
                            }`}>
                                {pred.probabilities.away}%
                            </div>
                        </div>
                    </div>

                    {/* Quick Picks */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2 text-center">
                            <div className="text-[8px] sm:text-[10px] text-gray-500">Result</div>
                            <div className={`font-bold text-xs sm:text-sm ${
                                pred.matchResult === 'Home Win' ? 'text-green-700' :
                                pred.matchResult === 'Away Win' ? 'text-red-700' :
                                'text-yellow-700'
                            }`}>
                                {pred.matchResult}
                            </div>
                            <div className="text-[8px] text-gray-400">{pred.resultConfidence}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2 text-center">
                            <div className="text-[8px] sm:text-[10px] text-gray-500">Over/Under</div>
                            <div className="font-bold text-xs sm:text-sm text-gray-800">{pred.overUnder}</div>
                            <div className="text-[8px] text-gray-400">{pred.overConfidence}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2 text-center">
                            <div className="text-[8px] sm:text-[10px] text-gray-500">BTTS</div>
                            <div className={`font-bold text-xs sm:text-sm ${
                                pred.btts === 'Yes' ? 'text-green-700' : 'text-gray-700'
                            }`}>
                                {pred.btts}
                            </div>
                            <div className="text-[8px] text-gray-400">{pred.bttsConfidence}</div>
                        </div>
                    </div>

                    {/* Expected Goals */}
                    <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-gray-600 bg-blue-50 rounded-lg p-2 border border-blue-100">
                        <span className="flex items-center gap-1">
                            <Target size={14} className="text-blue-500" />
                            Expected Goals
                        </span>
                        <div className="flex gap-2 sm:gap-4">
                            <span className="font-medium">{pred.expectedGoals.home} 🏠</span>
                            <span className="font-medium">{pred.expectedGoals.away} ✈️</span>
                            <span className="font-bold text-blue-700">Total: {pred.expectedGoals.total}</span>
                        </div>
                    </div>

                    {/* Expandable Details */}
                    <button
                        onClick={() => toggleExpanded(match.id)}
                        className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                        {isExpanded ? (
                            <>Show Less <ChevronUp size={14} /></>
                        ) : (
                            <>Show More Details <ChevronDown size={14} /></>
                        )}
                    </button>

                    {isExpanded && (
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                            {/* H2H Summary */}
                            {pred.h2h && pred.h2h.total > 0 && (
                                <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                                    <div className="text-xs text-gray-500 mb-1">Head-to-Head</div>
                                    <div className="flex justify-center gap-4 text-sm">
                                        <span className="font-medium text-green-700">{pred.h2h.homeWins}W</span>
                                        <span className="font-medium text-yellow-700">{pred.h2h.draws}D</span>
                                        <span className="font-medium text-red-700">{pred.h2h.awayWins}L</span>
                                        <span className="text-gray-400">({pred.h2h.total} games)</span>
                                    </div>
                                </div>
                            )}

                            {/* Correct Scores */}
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                                <div className="text-xs text-gray-500 text-center mb-1">Top Correct Scores</div>
                                <div className="flex justify-center gap-3 sm:gap-4">
                                    {pred.correctScores && pred.correctScores.map((score, i) => (
                                        <div key={i} className="text-center">
                                            <span className="font-bold text-gray-800 text-sm">{score.display}</span>
                                            <span className="text-xs text-gray-400 ml-1">({score.probability})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* HT/FT */}
                            {pred.htft && (
                                <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 text-center">
                                    <div className="text-xs text-gray-500">Half-Time / Full-Time</div>
                                    <div className="font-bold text-blue-700">{pred.htft.display}</div>
                                    <div className="text-xs text-gray-400">{pred.htft.confidence}% confidence</div>
                                </div>
                            )}

                            {/* Advice */}
                            <div className="text-xs sm:text-sm text-gray-600 italic bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                💡 {pred.advice}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ✅ Render Leaderboard Item
    const renderLeaderboardItem = (prediction, index) => {
        const data = prediction.prediction_data || {}
        const isOwn = user?.id === prediction.user_id
        const medal = index === 0 ? <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" /> : 
                      index === 1 ? <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" /> : 
                      index === 2 ? <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" /> : 
                      <span className="text-gray-400 font-bold text-sm">#{index + 1}</span>

        return (
            <Link
                to={`/feed?highlight=${prediction.id}`}
                key={prediction.id} 
                className={`bg-white rounded-xl shadow-sm border p-3 mb-2 flex items-center gap-3 hover:shadow-md transition ${
                    isOwn ? 'border-2 border-green-500' : 'border-gray-100'
                }`}
            >
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    {medal}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                            {prediction.user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-xs sm:text-sm flex items-center gap-1 truncate">
                                {prediction.user?.full_name || prediction.user?.username || 'Unknown'}
                                {prediction.user?.is_verified && <VerifiedBadge size="sm" />}
                                {isOwn && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">You</span>}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                                {data.result || 'Draw'} • {data.overUnder || 'Over 2.5'} • {data.btts || 'No'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-red-500 font-bold text-xs sm:text-sm flex items-center gap-1 justify-end">
                        <Heart size={12} className="sm:size-14" fill="currentColor" /> {prediction.likes_count || 0}
                    </div>
                    <div className="text-[10px] text-gray-400">{new Date(prediction.created_at).toLocaleDateString()}</div>
                </div>
            </Link>
        )
    }

    // League tabs configuration
    const leagueTabs = [
        { id: COMPETITIONS.PREMIER_LEAGUE, label: 'Premier League', icon: '🏴' },
        { id: COMPETITIONS.LA_LIGA, label: 'La Liga', icon: '🇪🇸' },
        { id: COMPETITIONS.BUNDESLIGA, label: 'Bundesliga', icon: '🇩🇪' },
        { id: COMPETITIONS.SERIE_A, label: 'Serie A', icon: '🇮🇹' },
        { id: COMPETITIONS.LIGUE_1, label: 'Ligue 1', icon: '🇫🇷' },
        { id: COMPETITIONS.CHAMPIONS_LEAGUE, label: 'UCL', icon: '🌟' },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 pb-20">
            {/* Header - Changed to "Premium Predictions" */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles size={20} className="sm:size-24 text-yellow-500" /> 
                    Premium Predictions
                </h1>
                <p className="text-sm text-gray-500">AI-powered match predictions updated daily • Leaderboard shows top community predictions</p>
                {predictions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                        📅 {new Date().toLocaleDateString()} • {predictions.length} upcoming matches predicted
                    </p>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ================= LEFT SIDEBAR: LEADERBOARD ================= */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Trophy size={18} className="sm:size-20 text-yellow-500" /> Leaderboard
                            </h2>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setTimeFrame('today')}
                                    className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${
                                        timeFrame === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setTimeFrame('week')}
                                    className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${
                                        timeFrame === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setTimeFrame('month')}
                                    className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium ${
                                        timeFrame === 'month' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Month
                                </button>
                            </div>
                        </div>

                        {/* SCROLLABLE LIST */}
                        <div className="max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
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
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a team..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 text-sm"
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

                    {/* League Tabs */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                        {leagueTabs.map((league) => (
                            <button
                                key={league.id}
                                onClick={() => setSelectedLeague(league.id)}
                                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition flex items-center gap-1 sm:gap-1.5 ${
                                    selectedLeague === league.id 
                                        ? 'bg-gray-800 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <span>{league.icon}</span>
                                {league.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                            <div className="text-gray-400 mt-2">Loading predictions...</div>
                        </div>
                    ) : filteredPredictions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
                            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">{searchQuery ? `No matches found for "${searchQuery}"` : `No upcoming matches for ${leagueNames[selectedLeague] || 'this league'}`}</p>
                            <p className="text-sm text-gray-400">Check back tomorrow for new predictions!</p>
                        </div>
                    ) : (
                        Object.entries(groupedPredictions).map(([league, matches]) => (
                            <div key={league} className="mb-6">
                                {/* League Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Flag size={16} className="text-green-600" />
                                    <h2 className="text-base sm:text-lg font-bold text-gray-800">{league}</h2>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{matches.length} matches</span>
                                </div>

                                {/* Match Cards Grid */}
                                <div className="space-y-4">
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

// ============================================
// HEAD-TO-HEAD DATA FETCHING
// ============================================
async function getHeadToHead(homeTeamId, awayTeamId) {
    if (!homeTeamId || !awayTeamId) {
        return []
    }

    try {
        const { data, error } = await supabase
            .from('head_to_head')
            .select('*')
            .or(`home_team_id.eq.${homeTeamId},away_team_id.eq.${homeTeamId}`)
            .or(`home_team_id.eq.${awayTeamId},away_team_id.eq.${awayTeamId}`)
            .order('match_date', { ascending: false })
            .limit(10)

        if (error) {
            return []
        }

        return data || []
    } catch (error) {
        return []
    }
}