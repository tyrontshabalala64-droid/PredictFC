 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useNavigate } from 'react-router-dom'  // ✅ ADD useNavigate
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Share2,
  XCircle,
  Loader,
  Search,
  BarChart3,
  Globe,
  ChevronRight
} from 'lucide-react'
import BouncingLoader from '../components/BouncingLoader'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { getMockOdds } from '../services/oddsService'

export default function Matches() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()  // ✅ ADD navigate
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

    // ✅ NEW: Navigate to Slip page with match data
    const handlePredict = (match) => {
        if (!user) {
            showToast('Please sign in to make predictions', 'warning')
            return
        }

        // Save match to localStorage so Slip page can load it
        const matchData = {
            id: match.id || match.matchId,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league,
            kickoff: match.kickoff,
            matchId: match.id || match.matchId
        }
        
        // Store in localStorage for the Slip page to pick up
        localStorage.setItem('predictfc_selected_match', JSON.stringify(matchData))
        
        // Navigate to Slip page
        navigate('/slip')
    }

    // Remove the modal functions since we're not using them anymore
    const openPredictionModal = (match) => {
        // ✅ Redirect to Slip instead
        handlePredict(match)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedMatch(null)
        setSelectedMarkets([])
        setOdds(null)
    }

    const toggleMarket = (marketType, option) => {
        // Not used anymore - kept for compatibility
    }

    const isMarketSelected = (marketType, pick) => {
        return false
    }

    const handleSubmitPrediction = async () => {
        // Not used anymore - predictions go through Slip
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
                        onClick={() => handlePredict(match)}
                        className="w-full mt-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-sm"
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
        <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={24} /> Matches
                    </h1>
                    <p className="text-gray-400 text-sm">View matches and add them to your bet slip</p>
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

            {/* ===== REMOVED MODAL - Predictions now go through Slip ===== */}
        </div>
    )
}