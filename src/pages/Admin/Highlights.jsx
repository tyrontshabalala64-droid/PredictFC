 // src/pages/Admin/Highlights.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import {
    Sparkles,
    Plus,
    Trash2,
    Edit2,
    Loader,
    X,
    Check,
    RefreshCw,
    AlertTriangle,
    Calendar,
    Trophy,
    ChevronRight,
    Clock,
    Users,
    Eye,
    CheckCircle,
    ArrowRight,
    Megaphone
} from 'lucide-react'
import BouncingLoader from '../../components/BouncingLoader'
import {
    getAdminHighlights,
    createAdminHighlight,
    deleteAdminHighlight,
    updateAdminHighlight,
    LEAGUE_INFO,
    CONTENT_TYPES
} from '../../services/adminHighlightService'
import { getTodaysMatches, formatMatch } from '../../services/footballApi'
import { getPredictionForMatch } from '../../services/predictionEngine'

export default function HighlightsManager() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [highlights, setHighlights] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [form, setForm] = useState({
        title: '',
        content_type: 'fixture',
        league: 'PL',
        content: '',
        image_url: '',
        link_url: '',
        priority: 0
    })

    // Selection state
    const [availableMatches, setAvailableMatches] = useState([])
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [availablePredictions, setAvailablePredictions] = useState([])
    const [selectedPrediction, setSelectedPrediction] = useState(null)
    const [loadingOptions, setLoadingOptions] = useState(false)

    // Load highlights on mount
    useEffect(() => {
        loadHighlights()
    }, [])

    // Load matches or predictions when league or content_type changes
    useEffect(() => {
        if (form.content_type === 'fixture') {
            loadMatchesForLeague(form.league)
        } else if (form.content_type === 'prediction') {
            loadPredictionsForLeague(form.league)
        } else {
            // Custom - clear selections
            setAvailableMatches([])
            setSelectedMatch(null)
            setAvailablePredictions([])
            setSelectedPrediction(null)
        }
        // Reset selections when content type changes
        setSelectedMatch(null)
        setSelectedPrediction(null)
        // Clear content if not custom
        if (form.content_type !== 'custom') {
            setForm(prev => ({ ...prev, content: '' }))
        }
    }, [form.content_type, form.league])

    // ---- Load data functions ----
    const loadMatchesForLeague = async (leagueCode) => {
        setLoadingOptions(true)
        try {
            const { matches } = await getTodaysMatches(leagueCode)
            const formatted = matches.slice(0, 20).map(m => formatMatch(m))
            setAvailableMatches(formatted)
        } catch (error) {
            console.error('Error loading matches:', error)
            showToast('Failed to load matches', 'error')
            setAvailableMatches([])
        } finally {
            setLoadingOptions(false)
        }
    }

    const loadPredictionsForLeague = async (leagueCode) => {
        setLoadingOptions(true)
        try {
            // First get matches for the league
            const { matches } = await getTodaysMatches(leagueCode)
            // For each match, get the AI prediction
            const predictionsWithMatches = await Promise.all(
                matches.slice(0, 20).map(async (match) => {
                    try {
                        const prediction = await getPredictionForMatch(match.id)
                        return {
                            match: match,
                            prediction: prediction
                        }
                    } catch (e) {
                        return null
                    }
                })
            )
            // Filter out nulls (matches without predictions)
            const valid = predictionsWithMatches.filter(p => p && p.prediction)
            setAvailablePredictions(valid)
        } catch (error) {
            console.error('Error loading predictions:', error)
            showToast('Failed to load predictions', 'error')
            setAvailablePredictions([])
        } finally {
            setLoadingOptions(false)
        }
    }

    // ---- CRUD operations ----
    const loadHighlights = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getAdminHighlights(100)
            setHighlights(data || [])
        } catch (error) {
            console.error('Error loading highlights:', error)
            setError('Failed to load highlights')
            // Fallback
            try {
                const { data, error: directError } = await supabase
                    .from('admin_highlights')
                    .select('*')
                    .order('created_at', { ascending: false })
                if (directError) throw directError
                setHighlights(data || [])
                setError('')
            } catch (fallbackError) {
                setError('Table may not exist yet. Please run the SQL setup first.')
                setHighlights([])
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Build the content and extra data
        let content = form.content.trim()
        let matchData = null
        let predictionData = null
        let matchId = null

        // Auto-generate content based on type
        if (form.content_type === 'fixture' && selectedMatch) {
            const home = selectedMatch.homeTeam?.name || 'Unknown'
            const away = selectedMatch.awayTeam?.name || 'Unknown'
            const time = selectedMatch.kickoff
                ? new Date(selectedMatch.kickoff).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'TBD'
            content = `${home} vs ${away} • ${time}`
            matchData = selectedMatch
            matchId = selectedMatch.id
        } else if (form.content_type === 'prediction' && selectedPrediction) {
            const home = selectedPrediction.match.homeTeam?.name || 'Unknown'
            const away = selectedPrediction.match.awayTeam?.name || 'Unknown'
            const result = selectedPrediction.prediction?.matchResult || selectedPrediction.prediction?.result || 'TBD'
            const confidence = selectedPrediction.prediction?.confidence || 0
            content = `${home} ${result} ${away} • ${confidence}% confidence`
            predictionData = selectedPrediction
            matchId = selectedPrediction.match.id
        } else if (form.content_type === 'custom') {
            // Content comes from textarea, no auto-generation
            if (!content) {
                setError('Please enter custom content')
                showToast('Please enter custom content', 'warning')
                return
            }
        } else {
            setError('Please select a match or prediction')
            showToast('Please select a match or prediction', 'warning')
            return
        }

        // Validate title
        if (!form.title.trim()) {
            setError('Please enter a title')
            showToast('Please enter a title', 'warning')
            return
        }

        // Prepare data for insert
        const data = {
            title: form.title.trim(),
            content_type: form.content_type,
            league: form.content_type === 'fixture' || form.content_type === 'prediction' ? form.league : null,
            content: content,
            image_url: form.image_url || null,
            link_url: form.link_url || null,
            priority: parseInt(form.priority) || 0,
            created_by: user.id,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            match_id: matchId,
            match_data: matchData,
            prediction_data: predictionData
        }

        setSubmitting(true)
        try {
            let result
            if (editing) {
                result = await updateAdminHighlight(editing.id, data)
                showToast('Highlight updated successfully', 'success')
            } else {
                result = await createAdminHighlight(data)
                showToast('Highlight created successfully', 'success')
            }
            setShowModal(false)
            setEditing(null)
            resetForm()
            loadHighlights()
        } catch (error) {
            console.error('Error saving highlight:', error)
            setError(error.message || 'Failed to save highlight')
            showToast('Failed to save highlight: ' + error.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this highlight?')) return
        
        try {
            console.log('🗑️ Attempting to delete highlight:', id)
            await deleteAdminHighlight(id)
            showToast('Highlight deleted successfully', 'success')
            loadHighlights()
        } catch (error) {
            console.error('❌ Error deleting highlight:', error)
            showToast('Failed to delete highlight: ' + error.message, 'error')
        }
    }

    const resetForm = () => {
        setForm({
            title: '',
            content_type: 'fixture',
            league: 'PL',
            content: '',
            image_url: '',
            link_url: '',
            priority: 0
        })
        setSelectedMatch(null)
        setSelectedPrediction(null)
        setAvailableMatches([])
        setAvailablePredictions([])
        setError('')
    }

    const openCreateModal = () => {
        resetForm()
        setEditing(null)
        setError('')
        setShowModal(true)
        // Load initial matches for default league
        setTimeout(() => {
            if (form.content_type === 'fixture') {
                loadMatchesForLeague(form.league)
            }
        }, 100)
    }

    const openEditModal = (highlight) => {
        setEditing(highlight)
        setForm({
            title: highlight.title,
            content_type: highlight.content_type,
            league: highlight.league || 'PL',
            content: highlight.content,
            image_url: highlight.image_url || '',
            link_url: highlight.link_url || '',
            priority: highlight.priority || 0
        })
        // If it's a fixture/prediction, try to restore the selection
        if (highlight.content_type === 'fixture' && highlight.match_data) {
            setSelectedMatch(highlight.match_data)
            setAvailableMatches([highlight.match_data])
        } else if (highlight.content_type === 'prediction' && highlight.prediction_data) {
            setSelectedPrediction(highlight.prediction_data)
            setAvailablePredictions([highlight.prediction_data])
        }
        setError('')
        setShowModal(true)
    }

    const handleSelectMatch = (match) => {
        setSelectedMatch(match)
        // Auto-fill title if empty
        if (!form.title.trim()) {
            const home = match.homeTeam?.name || 'Unknown'
            const away = match.awayTeam?.name || 'Unknown'
            setForm(prev => ({ ...prev, title: `${home} vs ${away}` }))
        }
        // Clear any prediction selection
        setSelectedPrediction(null)
    }

    const handleSelectPrediction = (pred) => {
        setSelectedPrediction(pred)
        // Auto-fill title if empty
        if (!form.title.trim()) {
            const home = pred.match.homeTeam?.name || 'Unknown'
            const away = pred.match.awayTeam?.name || 'Unknown'
            setForm(prev => ({ ...prev, title: `${home} vs ${away}` }))
        }
        // Clear any match selection
        setSelectedMatch(null)
    }

    const getContentTypeLabel = (type) => {
        return CONTENT_TYPES.find(t => t.value === type)?.label || type
    }

    const getLeagueLabel = (code) => {
        return LEAGUE_INFO[code]?.name || code
    }

    // ---- Render helpers ----
    const renderMatchSelection = () => {
        if (form.content_type !== 'fixture') return null

        if (loadingOptions) {
            return (
                <div className="flex items-center justify-center py-4">
                    <Loader size={20} className="animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-400">Loading matches...</span>
                </div>
            )
        }

        if (availableMatches.length === 0) {
            return (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                    No matches available for this league today.
                </div>
            )
        }

        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select a Match</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {availableMatches.map((match) => {
                        const isSelected = selectedMatch && selectedMatch.id === match.id
                        return (
                            <button
                                key={match.id}
                                type="button"
                                onClick={() => handleSelectMatch(match)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition ${isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        {match.homeTeam?.crest && (
                                            <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain" />
                                        )}
                                        <span className="font-medium text-sm">{match.homeTeam?.name || 'TBD'}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">vs</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-sm">{match.awayTeam?.name || 'TBD'}</span>
                                        {match.awayTeam?.crest && (
                                            <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {match.kickoff ? new Date(match.kickoff).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                    </span>
                                    {isSelected ? (
                                        <CheckCircle size={18} className="text-purple-600" />
                                    ) : (
                                        <span className="text-purple-600 text-xs font-medium">Select</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
                {selectedMatch && (
                    <div className="mt-2 text-sm text-purple-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Selected: {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                    </div>
                )}
            </div>
        )
    }

    const renderPredictionSelection = () => {
        if (form.content_type !== 'prediction') return null

        if (loadingOptions) {
            return (
                <div className="flex items-center justify-center py-4">
                    <Loader size={20} className="animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-400">Loading predictions...</span>
                </div>
            )
        }

        if (availablePredictions.length === 0) {
            return (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                    No Premium Predictions available for this league today.
                </div>
            )
        }

        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select a Premium Prediction</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {availablePredictions.map((item) => {
                        const isSelected = selectedPrediction && selectedPrediction.match.id === item.match.id
                        const predResult = item.prediction?.matchResult || item.prediction?.result || 'TBD'
                        const confidence = item.prediction?.confidence || 0
                        return (
                            <button
                                key={item.match.id}
                                type="button"
                                onClick={() => handleSelectPrediction(item)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition ${isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-sm">{item.match.homeTeam?.name || 'TBD'}</span>
                                    </div>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                                        predResult === 'Home Win' ? 'bg-green-100 text-green-700' :
                                        predResult === 'Away Win' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {predResult}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-sm">{item.match.awayTeam?.name || 'TBD'}</span>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {confidence}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSelected ? (
                                        <CheckCircle size={18} className="text-purple-600" />
                                    ) : (
                                        <span className="text-purple-600 text-xs font-medium">Select</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
                {selectedPrediction && (
                    <div className="mt-2 text-sm text-purple-600 flex items-center gap-1">
                        <CheckCircle size={16} />
                        Selected: {selectedPrediction.match.homeTeam?.name} {selectedPrediction.prediction?.matchResult || selectedPrediction.prediction?.result} {selectedPrediction.match.awayTeam?.name} ({selectedPrediction.prediction?.confidence || 0}% confidence)
                    </div>
                )}
            </div>
        )
    }

    const renderPreview = () => {
        let previewContent = null

        if (form.content_type === 'fixture' && selectedMatch) {
            previewContent = (
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>{getLeagueLabel(form.league)}</span>
                        <span>•</span>
                        <span>{selectedMatch.kickoff ? new Date(selectedMatch.kickoff).toLocaleString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            {selectedMatch.homeTeam?.crest && (
                                <img src={selectedMatch.homeTeam.crest} alt="" className="w-6 h-6 object-contain" />
                            )}
                            <span className="font-semibold">{selectedMatch.homeTeam?.name || 'TBD'}</span>
                        </div>
                        <span className="text-xs text-gray-400">vs</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{selectedMatch.awayTeam?.name || 'TBD'}</span>
                            {selectedMatch.awayTeam?.crest && (
                                <img src={selectedMatch.awayTeam.crest} alt="" className="w-6 h-6 object-contain" />
                            )}
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        Clicking this card will take users to the Matches page.
                    </div>
                </div>
            )
        } else if (form.content_type === 'prediction' && selectedPrediction) {
            const predResult = selectedPrediction.prediction?.matchResult || selectedPrediction.prediction?.result || 'TBD'
            const confidence = selectedPrediction.prediction?.confidence || 0
            previewContent = (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-purple-700">
                        <Sparkles size={14} />
                        <span>Premium Prediction</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">
                            {confidence}% confidence
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold">{selectedPrediction.match.homeTeam?.name || 'TBD'}</span>
                        <span className={`font-bold text-xs px-3 py-1 rounded-full ${
                            predResult === 'Home Win' ? 'bg-green-100 text-green-700' :
                            predResult === 'Away Win' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {predResult}
                        </span>
                        <span className="font-semibold">{selectedPrediction.match.awayTeam?.name || 'TBD'}</span>
                    </div>
                    {selectedPrediction.prediction?.overUnder && (
                        <div className="text-xs text-gray-500 mt-1">
                            Over/Under: {selectedPrediction.prediction.overUnder}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-blue-600">
                        Clicking this card will take users to the Premium Predictions page.
                    </div>
                </div>
            )
        } else if (form.content_type === 'custom') {
            previewContent = (
                <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-orange-700">
                        <Megaphone size={14} />
                        <span>Custom Post</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                        {form.content || 'Enter custom content above'}
                    </div>
                    {form.image_url && (
                        <img src={form.image_url} alt="preview" className="mt-2 h-16 object-cover rounded" />
                    )}
                </div>
            )
        } else {
            previewContent = (
                <div className="text-sm text-gray-400 text-center py-4">
                    Select a match, prediction, or enter custom content to see a preview.
                </div>
            )
        }

        return (
            <div className="mt-4 border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                {previewContent}
            </div>
        )
    }

    // ---- Main render ----
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <BouncingLoader size="lg" color="blue" text="Loading highlights..." />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles size={24} className="text-purple-500" /> Admin Highlights
                    </h2>
                    <p className="text-gray-400 text-sm">Manage featured content for the homepage</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> New Highlight
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={loadHighlights}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                        <RefreshCw size={14} /> Retry
                    </button>
                </div>
            )}

            {highlights.length === 0 && !error ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <Sparkles size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No highlights created yet</p>
                    <p className="text-sm text-gray-400">Create your first highlight to feature content on the homepage</p>
                </div>
            ) : highlights.length === 0 && error ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-500">Unable to load highlights</p>
                    <p className="text-sm text-gray-400">Please make sure you've run the SQL setup for admin_highlights table</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highlights.map((highlight) => (
                        <div key={highlight.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition relative group">
                            {/* Delete Button - Admin Only */}
                            <button
                                onClick={() => handleDelete(highlight.id)}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
                                title="Delete highlight"
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className="flex items-start justify-between">
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${highlight.content_type === 'fixture' ? 'bg-blue-100 text-blue-700' :
                                                highlight.content_type === 'prediction' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {getContentTypeLabel(highlight.content_type)}
                                        </span>
                                        {highlight.league && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {getLeagueLabel(highlight.league)}
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${highlight.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {highlight.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800">{highlight.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{highlight.content}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>Priority: {highlight.priority || 0}</span>
                                        <span>Expires: {highlight.expires_at ? new Date(highlight.expires_at).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 ml-2">
                                    <button
                                        onClick={() => openEditModal(highlight)}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Create/Edit Modal --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editing ? 'Edit Highlight' : 'Create Highlight'}
                            </h3>
                            <button
                                onClick={() => { setShowModal(false); setEditing(null); resetForm(); setError(''); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Premier League Fixtures"
                                        required
                                    />
                                </div>

                                {/* Content Type & League */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                                        <select
                                            value={form.content_type}
                                            onChange={(e) => setForm({ ...form, content_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {CONTENT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.icon} {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">League</label>
                                        <select
                                            value={form.league}
                                            onChange={(e) => setForm({ ...form, league: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            disabled={form.content_type === 'custom'}
                                        >
                                            {Object.entries(LEAGUE_INFO).map(([code, info]) => (
                                                <option key={code} value={code}>
                                                    {info.icon} {info.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Selection area */}
                                {form.content_type === 'fixture' && renderMatchSelection()}
                                {form.content_type === 'prediction' && renderPredictionSelection()}

                                {/* Custom content textarea */}
                                {form.content_type === 'custom' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                                        <textarea
                                            value={form.content}
                                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                            placeholder="Type your custom message here..."
                                            required
                                        />
                                    </div>
                                )}

                                {/* Optional image & link */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                                    <input
                                        type="text"
                                        value={form.image_url}
                                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                                    <input
                                        type="text"
                                        value={form.link_url}
                                        onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher = shows first)</label>
                                    <input
                                        type="number"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                                        className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        min="0"
                                        max="100"
                                    />
                                </div>

                                {/* Preview */}
                                {renderPreview()}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditing(null); resetForm(); setError(''); }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                                    {editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}