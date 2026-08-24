 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  XCircle,
  Globe,
  Lock,
  BarChart3,
  Loader,
  Trophy,
  CheckCircle,
  X,
  Home,
  Plane
} from 'lucide-react'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { getMockOdds } from '../services/oddsService'

export default function Slip() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)
    
    const [slip, setSlip] = useState([])
    const [selectedCompetition, setSelectedCompetition] = useState(COMPETITIONS.PREMIER_LEAGUE)
    
    const [showModal, setShowModal] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [odds, setOdds] = useState(null)
    const [selectedMarkets, setSelectedMarkets] = useState([])
    
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [shareType, setShareType] = useState('public')
    const [userCommunities, setUserCommunities] = useState([])
    const [selectedCommunity, setSelectedCommunity] = useState('')
    const [comment, setComment] = useState('')
    
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadMatches()
        if (user) {
            loadUserCommunities()
        }
        
        const savedSlip = localStorage.getItem('predictfc_slip')
        if (savedSlip) {
            try {
                const parsed = JSON.parse(savedSlip)
                setSlip(parsed)
            } catch (e) {
                console.error('Error loading slip:', e)
            }
        }
    }, [user, selectedCompetition])

    useEffect(() => {
        localStorage.setItem('predictfc_slip', JSON.stringify(slip))
    }, [slip])

    const loadMatches = async () => {
        setLoading(true)
        try {
            const response = await getTodaysMatches(selectedCompetition)
            const matchesData = response.matches || []
            
            const formattedMatches = matchesData.map(m => formatMatch(m))
            setMatches(formattedMatches)
        } catch (error) {
            console.error('Error loading matches:', error)
            showToast('Failed to load matches', 'error')
        } finally {
            setLoading(false)
        }
    }

    const loadUserCommunities = async () => {
        try {
            const { data } = await supabase
                .from('communities')
                .select('id, name')
                .eq('creator_id', user?.id)
            setUserCommunities(data || [])
            if (data?.length > 0) {
                setSelectedCommunity(data[0].id)
            }
        } catch (error) {
            console.error('Error loading communities:', error)
        }
    }

    const openSlipModal = (match) => {
        setSelectedMatch(match)
        setSelectedMarkets([])
        
        const matchOdds = getMockOdds(
            match.id || match.matchId || 'match-123',
            match.homeTeam?.name || 'Home',
            match.awayTeam?.name || 'Away'
        )
        setOdds(matchOdds)
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

    const addToSlip = () => {
        if (!selectedMatch) return
        if (selectedMarkets.length === 0) {
            showToast('Please select at least one market', 'warning')
            return
        }

        const slipEntry = {
            matchId: selectedMatch.id || selectedMatch.matchId || `match-${Date.now()}`,
            homeTeam: selectedMatch.homeTeam?.name || 'Home',
            awayTeam: selectedMatch.awayTeam?.name || 'Away',
            homeCrest: selectedMatch.homeTeam?.crest || null,
            awayCrest: selectedMatch.awayTeam?.crest || null,
            league: selectedMatch.league || 'Unknown',
            match: selectedMatch,
            markets: selectedMarkets,
            totalOdds: selectedMarkets.reduce((acc, m) => acc * m.odds, 1)
        }

        setSlip(prev => [...prev, slipEntry])
        showToast(`Added ${slipEntry.homeTeam} vs ${slipEntry.awayTeam} (${selectedMarkets.length} markets)`, 'success')
        closeModal()
    }

    const removeFromSlip = (matchId) => {
        setSlip(slip.filter(item => item.matchId !== matchId))
    }

    const clearSlip = () => {
        if (window.confirm('Clear all selections?')) {
            setSlip([])
            localStorage.removeItem('predictfc_slip')
        }
    }

    const handleShare = async () => {
        if (slip.length === 0) {
            showToast('Add at least one match to the slip', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const grandTotalOdds = slip.reduce((acc, item) => acc * item.totalOdds, 1)
            const potentialReturn = grandTotalOdds.toFixed(2)

            let slipText = `📊 Multi-Market Bet Slip:\n`
            slipText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
            
            slip.forEach((item, index) => {
                slipText += `\n${index + 1}. ${item.homeTeam} vs ${item.awayTeam}\n`
                item.markets.forEach(m => {
                    slipText += `   • ${m.label}: ${m.pick} (${m.odds.toFixed(2)})\n`
                })
                slipText += `   ─── Total Odds: ${item.totalOdds.toFixed(2)} ───\n`
            })
            
            slipText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━`
            slipText += `\n💰 Total Potential Return: ${potentialReturn}x`

            const fullText = comment ? `${comment}\n\n${slipText}` : slipText

            if (shareType === 'public') {
                const { error } = await supabase
                    .from('posts')
                    .insert({
                        user_id: user.id,
                        text: fullText,
                        likes_count: 0,
                        comments_count: 0
                    })
                if (error) throw error
                showToast('Slip shared to Feed!', 'success')
            } else {
                if (!selectedCommunity) {
                    showToast('Please select a community', 'error')
                    setSubmitting(false)
                    return
                }
                const { error } = await supabase
                    .from('community_posts')
                    .insert({
                        community_id: selectedCommunity,
                        user_id: user.id,
                        text: fullText
                    })
                if (error) throw error
                showToast('Slip shared to Community!', 'success')
            }

            setSlip([])
            setComment('')
            localStorage.removeItem('predictfc_slip')
            setShareModalOpen(false)

        } catch (error) {
            console.error('Error sharing slip:', error)
            showToast('Failed to share slip', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar size={24} /> Bet Slip                    </h1>
                    <p className="text-gray-400 text-sm">Select matches and predict multi-market outcomes</p>
                </div>
                {slip.length > 0 && (
                    <div className="flex gap-2">
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {slip.length} selections
                        </span>
                        <button
                            onClick={() => setShareModalOpen(true)}
                            className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm flex items-center gap-1"
                        >
                            <Send size={16} /> Share
                        </button>
                        <button
                            onClick={clearSlip}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="mb-4">
                        <select
                            value={selectedCompetition}
                            onChange={(e) => setSelectedCompetition(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            <option value={COMPETITIONS.PREMIER_LEAGUE}>Premier League</option>
                            <option value={COMPETITIONS.LA_LIGA}>La Liga</option>
                            <option value={COMPETITIONS.BUNDESLIGA}>Bundesliga</option>
                            <option value={COMPETITIONS.SERIE_A}>Serie A</option>
                            <option value={COMPETITIONS.LIGUE_1}>Ligue 1</option>
                            <option value={COMPETITIONS.CHAMPIONS_LEAGUE}>Champions League</option>
                            <option value={COMPETITIONS.WORLD_CUP}>FIFA World Cup</option>
                            <option value={COMPETITIONS.EREDIVISIE}>Eredivisie</option>
                            <option value={COMPETITIONS.BRAZIL_SERIE_A}>Brasileirão</option>
                            <option value={COMPETITIONS.CHAMPIONSHIP}>Championship</option>
                            <option value={COMPETITIONS.PRIMEIRA_LIGA}>Primeira Liga</option>
                            <option value={COMPETITIONS.EUROPEAN_CHAMPIONSHIP}>European Championship</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading matches...</div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400">No matches available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matches.map((match) => {
                                const inSlip = slip.some(item => item.matchId === match.id)
                                // ✅ NEW LOGIC: Only allow adding future matches
                                const isMatchOpen = match.kickoff ? new Date(match.kickoff) > new Date() : false
                                const canAdd = isMatchOpen && !inSlip

                                return (
                                    <div key={match.id} className={`bg-white rounded-xl shadow-sm border p-4 transition ${inSlip ? 'border-gray-400' : 'border-gray-100'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-400 font-medium mb-1">
                                                    {match.league || 'Unknown League'}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-medium text-gray-800">{match.homeTeam?.name || 'Home'}</span>
                                                    <span className="text-gray-400 text-sm">vs</span>
                                                    <span className="font-medium text-gray-800">{match.awayTeam?.name || 'Away'}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {match.kickoff ? new Date(match.kickoff).toLocaleDateString() : ''}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {inSlip ? (
                                                    <button
                                                        onClick={() => removeFromSlip(match.id)}
                                                        className="px-3 py-1.5 bg-gray-100 text-red-500 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
                                                    >
                                                        <Minus size={14} /> Remove
                                                    </button>
                                                ) : canAdd ? (
                                                    <button
                                                        onClick={() => openSlipModal(match)}
                                                        className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm flex items-center gap-1"
                                                    >
                                                        <Plus size={14} /> Add
                                                    </button>
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm">
                                                        Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-20">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Calendar size={18} /> Your Slip
                            {slip.length > 0 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {slip.length}
                                </span>
                            )}
                        </h3>

                        {slip.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                                <p className="text-sm">No selections yet</p>
                                <p className="text-xs">Add matches from the list</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {slip.map((item) => (
                                    <div key={item.matchId} className="border-b border-gray-100 pb-3 last:border-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="text-xs font-medium text-gray-700">
                                                    {item.homeTeam} vs {item.awayTeam}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromSlip(item.matchId)}
                                                className="text-gray-400 hover:text-red-500 text-xs"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-1 bg-gray-50 rounded-lg p-2">
                                            {item.markets.map((m, i) => (
                                                <div key={i} className="flex justify-between text-xs text-gray-600">
                                                    <span>{m.label}: <strong>{m.pick}</strong></span>
                                                    <span className="text-gray-400">@{m.odds.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-2 text-xs text-right font-semibold text-green-600">
                                            Total: {item.totalOdds.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {slip.length > 0 && (
                            <button
                                onClick={() => setShareModalOpen(true)}
                                className="w-full mt-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-1 text-sm"
                            >
                                <Send size={16} /> Share Slip
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* === MULTI-MARKET MODAL === */}
            {showModal && selectedMatch && odds && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 size={20} /> Add to Slip
                                </h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
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

                                <button
                                    onClick={addToSlip}
                                    disabled={selectedMarkets.length === 0}
                                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Add to Slip ({selectedMarkets.length} markets)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === SHARE MODAL === */}
            {shareModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Share Bet Slip</h3>
                            <button 
                                onClick={() => setShareModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Where to share?</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setShareType('public')}
                                    className={`py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                                        shareType === 'public'
                                            ? 'bg-gray-800 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Globe size={16} /> Feed
                                </button>
                                <button
                                    onClick={() => setShareType('private')}
                                    className={`py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                                        shareType === 'private'
                                            ? 'bg-gray-800 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Lock size={16} /> Community
                                </button>
                            </div>
                        </div>

                        {shareType === 'private' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Community</label>
                                <select
                                    value={selectedCommunity}
                                    onChange={(e) => setSelectedCommunity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800"
                                >
                                    {userCommunities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Add a comment (optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="What do you think about these matches?"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 resize-none"
                                rows="3"
                            />
                        </div>

                        <button
                            onClick={handleShare}
                            disabled={submitting}
                            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-1"
                        >
                            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send size={16} />}
                            {submitting ? 'Sharing...' : 'Share Slip'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}