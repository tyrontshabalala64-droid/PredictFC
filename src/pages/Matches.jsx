 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Share2,
  XCircle,
  Loader,
  Search,
  BarChart3,
  Globe
} from 'lucide-react'
import BouncingLoader from '../components/BouncingLoader'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { getMockOdds } from '../services/oddsService'

export default function Matches() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const [allMatches, setAllMatches] = useState([])
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [odds, setOdds] = useState(null)
    
    const [selectedMarkets, setSelectedMarkets] = useState([])
    const [isPublic, setIsPublic] = useState(true)
    const [communityId, setCommunityId] = useState('')
    const [userCommunities, setUserCommunities] = useState([])
    const [selectedCompetition, setSelectedCompetition] = useState(COMPETITIONS.PREMIER_LEAGUE)
    const [submitting, setSubmitting] = useState(false)
    const [sharedPredictions, setSharedPredictions] = useState({})

    useEffect(() => {
        loadMatches()
        if (user) {
            loadUserCommunities()
            loadUserSharedPredictions()
        }
    }, [filter, selectedCompetition, user])

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setMatches(allMatches)
        } else {
            const query = searchQuery.toLowerCase().trim()
            const filtered = allMatches.filter(match => {
                const homeName = match.homeTeam?.name?.toLowerCase() || ''
                const awayName = match.awayTeam?.name?.toLowerCase() || ''
                const leagueName = match.league?.toLowerCase() || ''
                return homeName.includes(query) || awayName.includes(query) || leagueName.includes(query)
            })
            setMatches(filtered)
        }
    }, [searchQuery, allMatches])

    const loadMatches = async () => {
        setLoading(true)
        try {
            const response = await getTodaysMatches(selectedCompetition)
            const matchesData = response.matches || []
            const formattedMatches = matchesData.map(m => formatMatch(m))
            
            setAllMatches(formattedMatches)
            
            let filtered = formattedMatches
            const now = new Date()
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

            if (filter === 'all') {
                filtered = formattedMatches
            } else if (filter === 'today') {
                filtered = formattedMatches.filter(m => {
                    if (!m.kickoff) return false
                    const kickoff = new Date(m.kickoff)
                    return kickoff >= todayStart && kickoff < todayEnd
                })
            } else if (filter === 'upcoming') {
                filtered = formattedMatches.filter(m => {
                    if (!m.kickoff) return false
                    const kickoff = new Date(m.kickoff)
                    return kickoff >= todayEnd
                })
            } else if (filter === 'live') {
                filtered = formattedMatches.filter(m => m.status === 'live')
            } else if (filter === 'finished') {
                filtered = formattedMatches.filter(m => m.status === 'finished')
            }
            setMatches(filtered)
        } catch (error) {
            console.error('Error loading matches:', error)
            showToast('Failed to load matches', 'error')
            setAllMatches([])
            setMatches([])
        } finally {
            setLoading(false)
        }
    }

    const loadUserCommunities = async () => {
        if (!user) return
        try {
            const { data } = await supabase
                .from('communities')
                .select('id, name')
                .eq('creator_id', user.id)
            setUserCommunities(data || [])
            if (data?.length > 0) {
                setCommunityId(data[0].id)
            }
        } catch (error) {
            console.error('Error loading communities:', error)
        }
    }

    const loadUserSharedPredictions = async () => {
        if (!user) return
        try {
            const { data: publicData } = await supabase
                .from('public_predictions')
                .select('match_id')
                .eq('user_id', user.id)
            
            const { data: communityData } = await supabase
                .from('community_posts')
                .select('match_id')
                .eq('user_id', user.id)

            const shared = {}
            publicData?.forEach(p => { shared[p.match_id] = true })
            communityData?.forEach(p => { shared[p.match_id] = true })
            setSharedPredictions(shared)
        } catch (error) {
            console.error('Error loading shared predictions:', error)
        }
    }

    const openPredictionModal = (match) => {
        if (!user) {
            showToast('Please sign in to make predictions', 'warning')
            return
        }
        setSelectedMatch(match)
        setSelectedMarkets([])
        
        const matchOdds = getMockOdds(
            match.id || match.matchId || 'match-123',
            match.homeTeam?.name || 'Home',
            match.awayTeam?.name || 'Away'
        )
        setOdds(matchOdds)
        
        setIsPublic(true)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedMatch(null)
        setSelectedMarkets([])
        setOdds(null)
    }

    const toggleMarket = (marketType, option) => {
        setSelectedMarkets(prev => {
            const existing = prev.findIndex(m => m.type === marketType)
            
            const marketLabels = {
                'match_result': 'Match Result',
                'over_under_25': 'Over/Under 2.5 Goals',
                'btts': 'Both Teams to Score',
                'corners': 'Total Corners',
                'total_goals_15': 'Total Goals (1.5)'
            }

            if (existing !== -1 && prev[existing].pick === option.pick) {
                return prev.filter((_, i) => i !== existing)
            }

            if (existing !== -1) {
                const newMarkets = [...prev]
                newMarkets[existing] = {
                    type: marketType,
                    pick: option.pick,
                    odds: option.odds,
                    label: marketLabels[marketType] || option.pick
                }
                return newMarkets
            }

            return [...prev, {
                type: marketType,
                pick: option.pick,
                odds: option.odds,
                label: marketLabels[marketType] || option.pick
            }]
        })
    }

    const isMarketSelected = (marketType, pick) => {
        return selectedMarkets.some(m => m.type === marketType && m.pick === pick)
    }

    const handleSubmitPrediction = async () => {
        if (!selectedMatch || !user) return
        if (selectedMarkets.length === 0) {
            showToast('Please select at least one market', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const matchId = selectedMatch.id || selectedMatch.matchId || `match-${Date.now()}`
            const homeTeam = selectedMatch.homeTeam?.name || 'Home'
            const awayTeam = selectedMatch.awayTeam?.name || 'Away'

            const predictionData = {
                matchId,
                homeTeam,
                awayTeam,
                matchName: `${homeTeam} vs ${awayTeam}`,
                markets: selectedMarkets,
                isPublic
            }

            if (isPublic) {
                const { error } = await supabase
                    .from('public_predictions')
                    .insert({
                        user_id: user.id,
                        match_id: matchId,
                        prediction_data: predictionData
                    })
                if (error) throw error

                await supabase
                    .from('profiles')
                    .update({ 
                        points: (profile?.points || 0) + 10,
                        predictions_count: (profile?.predictions_count || 0) + 1
                    })
                    .eq('id', user.id)

                showToast('Prediction shared publicly! You earned 10 points!', 'success')

            } else {
                const communityIdToUse = communityId
                if (!communityIdToUse) {
                    showToast('Please select a community first!', 'error')
                    setSubmitting(false)
                    return
                }

                const { data: communityData } = await supabase
                    .from('communities')
                    .select('id')
                    .eq('id', communityIdToUse)
                    .eq('creator_id', user.id)
                    .maybeSingle()

                if (!communityData) {
                    showToast('You can only share predictions to communities you created!', 'error')
                    setSubmitting(false)
                    return
                }

                const { error } = await supabase
                    .from('community_posts')
                    .insert({
                        community_id: communityIdToUse,
                        user_id: user.id,
                        match_id: matchId,
                        text: `Multi-market prediction for ${homeTeam} vs ${awayTeam}`,
                        prediction_data: predictionData
                    })
                if (error) throw error

                showToast('Prediction shared in your community!', 'success')
            }

            setSharedPredictions(prev => ({ ...prev, [matchId]: true }))
            closeModal()
            await loadMatches()
            await loadUserSharedPredictions()

        } catch (error) {
            console.error('Error submitting prediction:', error)
            showToast('Failed to submit prediction: ' + error.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const renderMatchCard = (match) => {
        const matchId = match.id || match.matchId || `match-${Date.now()}`
        const homeName = match.homeTeam?.name || 'Unknown'
        const awayName = match.awayTeam?.name || 'Unknown'
        const isShared = sharedPredictions[matchId]
        const isMatchOpen = match.kickoff ? new Date(match.kickoff) > new Date() : false
        const canPredict = isMatchOpen && !isShared

        const matchDate = match.kickoff ? new Date(match.kickoff) : new Date()
        const dateStr = matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const timeStr = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

        return (
            <div key={matchId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Trophy size={12} /> {match.league || 'Unknown League'}
                    </span>
                    <div className="flex items-center gap-2">
                        {isShared && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Shared</span>}
                        {!isMatchOpen && !isShared && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Closed</span>}
                        {match.status === 'live' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                        {match.status === 'finished' && <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">FT</span>}
                    </div>
                </div>

                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                        {match.homeTeam?.crest ? (
                            <img src={match.homeTeam.crest} alt={homeName} className="w-8 h-8 object-contain" />
                        ) : (
                            <Globe size={24} className="text-gray-400" />
                        )}
                        <span className="font-medium text-gray-800">{homeName}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-sm">vs</span>
                        {(match.status === 'live' || match.status === 'finished') && (
                            <span className="font-bold text-lg">
                                {match.score?.home || 0} - {match.score?.away || 0}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-800">{awayName}</span>
                        {match.awayTeam?.crest ? (
                            <img src={match.awayTeam.crest} alt={awayName} className="w-8 h-8 object-contain" />
                        ) : (
                            <Globe size={24} className="text-gray-400" />
                        )}
                    </div>
                </div>

                <div className="text-xs text-gray-400 text-center py-1 flex items-center justify-center gap-2">
                    <Calendar size={12} /> {dateStr} at {timeStr}
                    {match.venue && match.venue !== 'Unknown Venue' && (
                        <span className="ml-2">📍 {match.venue}</span>
                    )}
                </div>

                {canPredict ? (
                    <button 
                        onClick={() => openPredictionModal(match)}
                        className="w-full mt-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1 bg-gray-800 text-white hover:bg-gray-900"
                    >
                        <Share2 size={16} /> Predict
                    </button>
                ) : isShared ? (
                    <button 
                        disabled
                        className="w-full mt-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1 bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                        <Share2 size={16} /> Shared
                    </button>
                ) : (
                    <div className="w-full mt-3 py-2 text-center text-sm text-gray-400 bg-gray-50 rounded-lg flex items-center justify-center gap-1">
                        <Clock size={16} /> Match has started
                    </div>
                )}
            </div>
        )
    }

    const leagueOptions = [
        { id: COMPETITIONS.PREMIER_LEAGUE, label: '🏴 Premier League' },
        { id: COMPETITIONS.LA_LIGA, label: '🇪🇸 La Liga' },
        { id: COMPETITIONS.BUNDESLIGA, label: '🇩🇪 Bundesliga' },
        { id: COMPETITIONS.SERIE_A, label: '🇮🇹 Serie A' },
        { id: COMPETITIONS.LIGUE_1, label: '🇫🇷 Ligue 1' },
        { id: COMPETITIONS.CHAMPIONS_LEAGUE, label: '🌟 Champions League' },
        { id: COMPETITIONS.WORLD_CUP, label: '🏆 FIFA World Cup' },
        { id: COMPETITIONS.EREDIVISIE, label: '🇳🇱 Eredivisie' },
        { id: COMPETITIONS.BRAZIL_SERIE_A, label: '🇧🇷 Brasileirão' },
        { id: COMPETITIONS.CHAMPIONSHIP, label: '🏴 Championship' },
        { id: COMPETITIONS.PRIMEIRA_LIGA, label: '🇵🇹 Primeira Liga' },
        { id: COMPETITIONS.EUROPEAN_CHAMPIONSHIP, label: '🏆 European Championship' },
        { id: COMPETITIONS.PSL, label: '🇿🇦 PSL' },
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={24} /> Matches
                    </h1>
                    <p className="text-gray-400 text-sm">View matches and share your multi-market predictions</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <select
                        value={selectedCompetition}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        {leagueOptions.map(league => (
                            <option key={league.id} value={league.id}>{league.label}</option>
                        ))}
                    </select>
                    
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All</button>
                    <button onClick={() => setFilter('today')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Today</button>
                    <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'upcoming' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Upcoming</button>
                    <button onClick={() => setFilter('live')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${filter === 'live' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Clock size={16} /> Live</button>
                    <button onClick={() => setFilter('finished')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'finished' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Finished</button>
                </div>
            </div>

            <div className="relative mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teams, leagues..."
                    className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <XCircle size={18} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <BouncingLoader size="lg" color="green" text="Loading matches..." />
                </div>
            ) : matches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">{searchQuery ? `No matches found for "${searchQuery}"` : filter === 'today' ? 'No matches scheduled for today' : filter === 'live' ? 'No live matches right now' : filter === 'finished' ? 'No finished matches right now' : filter === 'upcoming' ? 'No upcoming matches scheduled' : 'No matches found'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map(renderMatchCard)}
                </div>
            )}

            {showModal && selectedMatch && odds && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 size={20} /> Multi-Market Prediction
                                </h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="bg-gray-100 rounded-lg p-4 mb-4 text-center border border-gray-200">
                                <div className="flex items-center justify-center gap-3 font-semibold text-gray-800 text-lg">
                                    <span>{selectedMatch.homeTeam?.name || 'Home'}</span>
                                    <span className="text-gray-400 text-sm">vs</span>
                                    <span>{selectedMatch.awayTeam?.name || 'Away'}</span>
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {selectedMatch.league || 'Unknown League'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {selectedMarkets.length > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-green-700">Your selections ({selectedMarkets.length})</span>
                                            <button
                                                onClick={() => setSelectedMarkets([])}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {selectedMarkets.map((m, i) => (
                                                <div key={i} className="flex justify-between text-sm text-green-700">
                                                    <span>{m.label}: <strong>{m.pick}</strong></span>
                                                    <span>@{m.odds.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-green-200 text-sm text-green-700 flex justify-between">
                                            <span>Total selections</span>
                                            <span className="font-bold">{selectedMarkets.length}</span>
                                        </div>
                                    </div>
                                )}

                                {Object.entries(odds).map(([key, market]) => (
                                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-medium text-gray-700 mb-2">{market.label}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {market.options.map((option, i) => {
                                                const selected = isMarketSelected(key, option.pick)
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => toggleMarket(key, option)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                                                            selected
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <span>{option.pick}</span>
                                                        <span className={selected ? 'text-green-200' : 'text-gray-400'}>
                                                            @{option.odds.toFixed(2)}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                            className="w-5 h-5 accent-gray-800"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-700">
                                                {isPublic ? 'Make this prediction public' : 'Keep private in community'}
                                            </span>
                                            <p className="text-sm text-gray-400">
                                                {isPublic ? 'Anyone can see this on the global Feed' : 'Only members of your community can see this'}
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {!isPublic && userCommunities.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Choose Community</label>
                                        <select
                                            value={communityId}
                                            onChange={(e) => setCommunityId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800"
                                        >
                                            {userCommunities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {!isPublic && userCommunities.length === 0 && (
                                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                        <p className="text-sm text-yellow-700">
                                            You need to <Link to="/community/create" className="font-semibold underline">create a community</Link> first to share private predictions!
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmitPrediction}
                                    disabled={submitting || selectedMarkets.length === 0}
                                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Share2 size={18} />}
                                    {submitting ? 'Sharing...' : `Share Prediction (${selectedMarkets.length} markets)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}