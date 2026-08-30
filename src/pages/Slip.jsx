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
  Plane,
  TrendingUp,
  DollarSign,
  Ticket
} from 'lucide-react'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import { getMockOdds } from '../services/oddsService'
import { createSlipRecord } from '../services/slipTrackingService'

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
    const [stake, setStake] = useState('')
    
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

    // ✅ Calculate total odds by ADDING
    const calculateTotalOdds = (markets) => {
        if (!markets || markets.length === 0) return 0
        const total = markets.reduce((acc, m) => {
            const odds = parseFloat(m.odds) || 0
            return acc + odds
        }, 0)
        return Math.round(total * 100) / 100
    }

    const addToSlip = () => {
        if (!selectedMatch) return
        if (selectedMarkets.length === 0) {
            showToast('Please select at least one market', 'warning')
            return
        }

        const totalOdds = calculateTotalOdds(selectedMarkets)

        const slipEntry = {
            matchId: selectedMatch.id || selectedMatch.matchId || `match-${Date.now()}`,
            homeTeam: selectedMatch.homeTeam?.name || 'Home',
            awayTeam: selectedMatch.awayTeam?.name || 'Away',
            homeCrest: selectedMatch.homeTeam?.crest || null,
            awayCrest: selectedMatch.awayTeam?.crest || null,
            league: selectedMatch.league || 'Unknown',
            match: selectedMatch,
            markets: selectedMarkets,
            totalOdds: totalOdds
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

    // ✅ Calculate grand total odds by ADDING
    const calculateGrandTotalOdds = () => {
        if (slip.length === 0) return 0
        const total = slip.reduce((acc, item) => {
            const odds = parseFloat(item.totalOdds) || 0
            return acc + odds
        }, 0)
        return Math.round(total * 100) / 100
    }

    // ✅ handleShare - properly captures stake and saves slip record
    const handleShare = async () => {
        if (slip.length === 0) {
            showToast('Add at least one match to the slip', 'warning')
            return
        }

        const stakeAmount = parseFloat(stake) || 0
        
        if (stakeAmount <= 0) {
            showToast('Please enter a stake amount', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const grandTotalOdds = calculateGrandTotalOdds()
            const potentialReturn = stakeAmount * grandTotalOdds

            let slipText = `📊 Multi-Market Bet Slip\n`
            slipText += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
            
            slip.forEach((item, index) => {
                slipText += `\n${index + 1}. ${item.homeTeam} vs ${item.awayTeam}\n`
                item.markets.forEach(m => {
                    slipText += `   • ${m.label}: ${m.pick} @${m.odds.toFixed(2)}\n`
                })
                slipText += `   ─── Combined Odds: ${item.totalOdds.toFixed(2)} ───\n`
            })
            
            slipText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━`
            slipText += `\n💰 Stake: R${stakeAmount.toFixed(2)}`
            slipText += `\n📊 Total Odds: ${grandTotalOdds.toFixed(2)}x`
            slipText += `\n💵 Total Return: R${potentialReturn.toFixed(2)}`

            const fullText = comment ? `${comment}\n\n${slipText}` : slipText

            let postData = null

            if (shareType === 'public') {
                const { data, error } = await supabase
                    .from('posts')
                    .insert({
                        user_id: user.id,
                        text: fullText,
                        likes_count: 0,
                        comments_count: 0
                    })
                    .select()
                    .single()

                if (error) throw error
                postData = data
                showToast('Slip shared to Feed!', 'success')
            } else {
                if (!selectedCommunity) {
                    showToast('Please select a community', 'error')
                    setSubmitting(false)
                    return
                }
                const { data, error } = await supabase
                    .from('community_posts')
                    .insert({
                        community_id: selectedCommunity,
                        user_id: user.id,
                        text: fullText
                    })
                    .select()
                    .single()

                if (error) throw error
                postData = data
                showToast('Slip shared to Community!', 'success')
            }

            // ✅ Save slip record for tracking
            if (postData) {
                const slipData = {
                    matches: slip.map(item => ({
                        matchId: item.matchId,
                        homeTeam: item.homeTeam,
                        awayTeam: item.awayTeam,
                        league: item.league,
                        markets: item.markets.map(m => ({
                            type: m.label,
                            pick: m.pick,
                            odds: m.odds
                        })),
                        totalOdds: item.totalOdds
                    })),
                    stake: stakeAmount,
                    totalOdds: grandTotalOdds,
                    potentialReturn: potentialReturn
                }

                await createSlipRecord(postData.id, user.id, slipData)
            }

            setSlip([])
            setComment('')
            setStake('')
            localStorage.removeItem('predictfc_slip')
            setShareModalOpen(false)

        } catch (error) {
            console.error('Error sharing slip:', error)
            showToast('Failed to share slip', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const totalSelections = slip.reduce((acc, item) => acc + item.markets.length, 0)
    const grandTotalOdds = calculateGrandTotalOdds()
    const stakeAmount = parseFloat(stake) || 0
    const potentialReturn = stakeAmount * grandTotalOdds

    const leagueOptions = [
        { id: COMPETITIONS.PREMIER_LEAGUE, label: '🏴 Premier League' },
        { id: COMPETITIONS.LA_LIGA, label: '🇪🇸 La Liga' },
        { id: COMPETITIONS.BUNDESLIGA, label: '🇩🇪 Bundesliga' },
        { id: COMPETITIONS.SERIE_A, label: '🇮🇹 Serie A' },
        { id: COMPETITIONS.LIGUE_1, label: '🇫🇷 Ligue 1' },
        { id: COMPETITIONS.CHAMPIONS_LEAGUE, label: '🌟 Champions League' },
        { id: COMPETITIONS.PSL, label: '🇿🇦 PSL' },
    ]

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* ===== HEADER WITH STYLING ===== */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md">
                            <Ticket size={22} />
                        </div>
                        Bet Slip
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Select matches and predict multi-market outcomes</p>
                </div>
                {slip.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-sm font-medium border border-green-200 flex items-center gap-1.5 shadow-sm">
                            <Calendar size={14} />
                            {slip.length} selections
                        </span>
                        <button
                            onClick={() => {
                                if (!stake || parseFloat(stake) <= 0) {
                                    showToast('Please enter a stake amount first', 'warning')
                                    return
                                }
                                setShareModalOpen(true)
                            }}
                            className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition text-sm flex items-center gap-1.5 shadow-sm"
                        >
                            <Send size={16} /> Share
                        </button>
                        <button
                            onClick={clearSlip}
                            className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1.5"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* ===== LEFT COLUMN - MATCHES ===== */}
                <div className="lg:col-span-2">
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Select League</label>
                        <select
                            value={selectedCompetition}
                            onChange={(e) => setSelectedCompetition(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                        >
                            {leagueOptions.map(league => (
                                <option key={league.id} value={league.id}>{league.label}</option>
                            ))}
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
                                const isMatchOpen = match.kickoff ? new Date(match.kickoff) > new Date() : false
                                const canAdd = isMatchOpen && !inSlip

                                return (
                                    <div 
                                        key={match.id} 
                                        className={`bg-white rounded-xl shadow-sm border p-4 transition-all duration-200 hover:shadow-md ${
                                            inSlip 
                                                ? 'border-green-400 bg-green-50/40 shadow-green-100' 
                                                : 'border-gray-100 hover:border-green-200'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                                                    {match.league || 'Unknown League'}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        {match.homeTeam?.crest && (
                                                            <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain" />
                                                        )}
                                                        <span className="font-semibold text-gray-800">{match.homeTeam?.name || 'Home'}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-medium">VS</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-800">{match.awayTeam?.name || 'Away'}</span>
                                                        {match.awayTeam?.crest && (
                                                            <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {match.kickoff ? new Date(match.kickoff).toLocaleString() : 'TBD'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {inSlip ? (
                                                    <button
                                                        onClick={() => removeFromSlip(match.id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition text-sm flex items-center gap-1"
                                                    >
                                                        <Minus size={14} /> Remove
                                                    </button>
                                                ) : canAdd ? (
                                                    <button
                                                        onClick={() => openSlipModal(match)}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition text-sm flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Plus size={14} /> Add
                                                    </button>
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-sm flex items-center gap-1">
                                                        <Lock size={12} /> Closed
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

                {/* ===== RIGHT COLUMN - YOUR SLIP ===== */}
                <div>
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sticky top-20">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white shadow-sm">
                                <Ticket size={16} />
                            </div>
                            Your Slip
                            {slip.length > 0 && (
                                <span className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 ml-auto">
                                    {slip.length}
                                </span>
                            )}
                        </h3>

                        {slip.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Ticket className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                                <p className="text-sm font-medium">No selections yet</p>
                                <p className="text-xs">Add matches from the list</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {slip.map((item) => (
                                        <div key={item.matchId} className="border-b border-gray-100 pb-3 last:border-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                                                        {item.homeTeam} vs {item.awayTeam}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromSlip(item.matchId)}
                                                    className="text-gray-400 hover:text-red-500 transition p-0.5"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-1 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                {item.markets.map((m, i) => (
                                                    <div key={i} className="flex justify-between text-xs text-gray-600">
                                                        <span>{m.label}: <strong>{m.pick}</strong></span>
                                                        <span className="text-green-600 font-medium">@{m.odds.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-2 text-xs text-right font-semibold text-green-600">
                                                Total: {item.totalOdds.toFixed(2)}x
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ===== STAKE INPUT ===== */}
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <DollarSign size={14} className="text-green-600" />
                                            Stake Amount (R)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={stake}
                                                onChange={(e) => setStake(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white shadow-sm transition"
                                                min="0"
                                                step="0.50"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                                <button
                                                    onClick={() => setStake((prev) => (parseFloat(prev) || 0) + 10)}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition"
                                                >
                                                    +10
                                                </button>
                                                <button
                                                    onClick={() => setStake((prev) => (parseFloat(prev) || 0) + 50)}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition"
                                                >
                                                    +50
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {stakeAmount > 0 && grandTotalOdds > 0 && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4 shadow-sm">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                                                        <TrendingUp size={14} /> Total Odds
                                                    </span>
                                                    <span className="text-lg font-bold text-gray-800">{grandTotalOdds.toFixed(2)}x</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                                                        <DollarSign size={14} /> Stake
                                                    </span>
                                                    <span className="text-lg font-bold text-gray-800">R{stakeAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="border-t-2 border-green-200 pt-2 mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                                                            <Trophy size={14} /> Total Return
                                                        </span>
                                                        <span className="text-xl font-bold text-green-600">R{potentialReturn.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-right mt-0.5">
                                                        <span className="text-xs text-green-500 font-medium">
                                                            Profit: R{(potentialReturn - stakeAmount).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        if (!stake || parseFloat(stake) <= 0) {
                                            showToast('Please enter a stake amount first', 'warning')
                                            return
                                        }
                                        setShareModalOpen(true)
                                    }}
                                    className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                                >
                                    <Send size={16} /> Share Slip
                                </button>
                            </>
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
                                    <BarChart3 size={20} className="text-green-600" /> Add to Slip
                                </h2>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 text-center border border-gray-200">
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
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 mb-4">
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
                                                    <span className="text-green-600 font-medium">@{m.odds.toFixed(2)}</span>
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
                                    <div key={key} className="border border-gray-200 rounded-xl p-3 hover:border-green-300 transition">
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
                                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
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
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
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
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Send size={20} className="text-green-600" /> Share Bet Slip
                            </h3>
                            <button 
                                onClick={() => setShareModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Where to share?</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setShareType('public')}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                                        shareType === 'public'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Globe size={16} /> Feed
                                </button>
                                <button
                                    onClick={() => setShareType('private')}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                                        shareType === 'private'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800"
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
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 resize-none"
                                rows="3"
                            />
                        </div>

                        {/* ===== SHARE SUMMARY ===== */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">📋 Matches</span>
                                    <span className="font-medium">{slip.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">📊 Total Odds</span>
                                    <span className="font-bold text-green-600">{grandTotalOdds.toFixed(2)}x</span>
                                </div>
                                {stakeAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">💰 Stake</span>
                                            <span className="font-bold text-gray-800">R{stakeAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 mt-1">
                                            <div className="flex justify-between text-base font-bold">
                                                <span className="text-green-700">💵 Total Return</span>
                                                <span className="text-green-600">R{potentialReturn.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleShare}
                            disabled={submitting || !stake || parseFloat(stake) <= 0}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Send size={16} />}
                            {submitting ? 'Sharing...' : 'Share Slip'}
                        </button>

                        {(!stake || parseFloat(stake) <= 0) && (
                            <p className="text-center text-xs text-red-400 mt-2">Please enter a stake amount above</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}