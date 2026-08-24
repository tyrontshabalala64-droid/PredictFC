 import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Trophy, 
  Calendar, 
  Sparkles,
  Loader,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  Target,
  Globe,
  Flag,
  Megaphone,
  X,
  AlertCircle,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'

const LEAGUE_CONFIG = {
  [COMPETITIONS.PREMIER_LEAGUE]: {
    name: 'Premier League',
    country: 'England',
    icon: Globe,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    selectedBg: 'bg-purple-600 dark:bg-purple-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.LA_LIGA]: {
    name: 'LaLiga',
    country: 'Spain',
    icon: Globe,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    selectedBg: 'bg-red-600 dark:bg-red-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.SERIE_A]: {
    name: 'Serie A',
    country: 'Italy',
    icon: Globe,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-600 dark:bg-blue-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.BUNDESLIGA]: {
    name: 'Bundesliga',
    country: 'Germany',
    icon: Globe,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    selectedBg: 'bg-yellow-600 dark:bg-yellow-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.LIGUE_1]: {
    name: 'Ligue 1',
    country: 'France',
    icon: Globe,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-500 dark:bg-blue-400',
    selectedText: 'text-white'
  },
  [COMPETITIONS.CHAMPIONS_LEAGUE]: {
    name: 'Champions League',
    country: 'Europe',
    icon: Trophy,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    selectedBg: 'bg-yellow-600 dark:bg-yellow-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.WORLD_CUP]: {
    name: 'FIFA World Cup',
    country: 'International',
    icon: Trophy,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-600 dark:bg-blue-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.EREDIVISIE]: {
    name: 'Eredivisie',
    country: 'Netherlands',
    icon: Globe,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    selectedBg: 'bg-orange-600 dark:bg-orange-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.BRAZIL_SERIE_A]: {
    name: 'Brasileirão',
    country: 'Brazil',
    icon: Globe,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    selectedBg: 'bg-green-600 dark:bg-green-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.CHAMPIONSHIP]: {
    name: 'Championship',
    country: 'England',
    icon: Globe,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    selectedBg: 'bg-blue-600 dark:bg-blue-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.PRIMEIRA_LIGA]: {
    name: 'Primeira Liga',
    country: 'Portugal',
    icon: Globe,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    selectedBg: 'bg-green-600 dark:bg-green-500',
    selectedText: 'text-white'
  },
  [COMPETITIONS.EUROPEAN_CHAMPIONSHIP]: {
    name: 'European Championship',
    country: 'Europe',
    icon: Trophy,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    selectedBg: 'bg-yellow-600 dark:bg-yellow-500',
    selectedText: 'text-white'
  }
}

export default function Home() {
    const { profile } = useAuth()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [matches, setMatches] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedLeague, setSelectedLeague] = useState(null)
    const [leagueMatchCounts, setLeagueMatchCounts] = useState({})
    const [announcements, setAnnouncements] = useState([])
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState([])
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
    const [popupAnnouncement, setPopupAnnouncement] = useState(null)

    const getWeekDates = () => {
        const dates = []
        const today = new Date()
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            dates.push(date)
        }
        return dates
    }

    const weekDates = getWeekDates()

    const formatDateDisplay = (date) => {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
    }

    const isToday = (date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    useEffect(() => {
        loadAnnouncements()
        const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
        setDismissedAnnouncements(dismissed)
    }, [])

    const loadAnnouncements = async () => {
        setLoadingAnnouncements(true)
        try {
            const now = new Date().toISOString()
            
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('active', true)
                .or(`start_date.is.null,start_date.lte.${now}`)
                .or(`end_date.is.null,end_date.gte.${now}`)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            const announcementsData = data || []
            setAnnouncements(announcementsData)

            const popup = announcementsData.find(a => 
                a.type === 'popup' && 
                !dismissedAnnouncements.includes(a.id)
            )
            if (popup) {
                setPopupAnnouncement(popup)
            }
        } catch (error) {
            console.error('Error loading announcements:', error)
            setAnnouncements([])
        } finally {
            setLoadingAnnouncements(false)
        }
    }

    const dismissAnnouncement = (id) => {
        const updated = [...dismissedAnnouncements, id]
        setDismissedAnnouncements(updated)
        localStorage.setItem('dismissed_announcements', JSON.stringify(updated))
        
        if (popupAnnouncement?.id === id) {
            setPopupAnnouncement(null)
        }
    }

    useEffect(() => {
        loadAllLeaguesMatches()
    }, [selectedDate])

    const loadAllLeaguesMatches = async () => {
        setLoading(true)
        try {
            const leagueIds = Object.values(COMPETITIONS)
            const results = {}
            const counts = {}

            for (const leagueId of leagueIds) {
                try {
                    const { matches } = await getTodaysMatches(leagueId)
                    const formattedMatches = matches.map(m => formatMatch(m))
                    
                    const dateStr = selectedDate.toISOString().split('T')[0]
                    const filtered = formattedMatches.filter(m => {
                        const matchDate = m.kickoff ? new Date(m.kickoff).toISOString().split('T')[0] : ''
                        return matchDate === dateStr
                    })
                    
                    results[leagueId] = filtered
                    counts[leagueId] = filtered.length
                } catch (error) {
                    console.error(`Error loading league ${leagueId}:`, error)
                    results[leagueId] = []
                    counts[leagueId] = 0
                }
            }

            setMatches(results)
            setLeagueMatchCounts(counts)
            
            const firstLeagueWithMatches = Object.keys(counts).find(id => counts[id] > 0)
            if (firstLeagueWithMatches) {
                setSelectedLeague(parseInt(firstLeagueWithMatches))
            } else if (Object.keys(counts).length > 0) {
                setSelectedLeague(parseInt(Object.keys(counts)[0]))
            }
        } catch (error) {
            console.error('Error loading matches:', error)
        } finally {
            setLoading(false)
        }
    }

    const getLeagueConfig = (leagueId) => {
        return LEAGUE_CONFIG[leagueId] || {
            name: 'Unknown League',
            country: 'Unknown',
            icon: Globe,
            iconColor: 'text-gray-600',
            bgColor: 'bg-gray-50 dark:bg-gray-900/20',
            borderColor: 'border-gray-200 dark:border-gray-700',
            selectedBg: 'bg-gray-600 dark:bg-gray-500',
            selectedText: 'text-white'
        }
    }

    const renderMatchCard = (match) => {
        const homeName = match.homeTeam?.name || 'Unknown'
        const awayName = match.awayTeam?.name || 'Unknown'
        const homeCrest = match.homeTeam?.crest
        const awayCrest = match.awayTeam?.crest
        
        const matchDate = match.kickoff ? new Date(match.kickoff) : new Date()
        const timeStr = matchDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })

        return (
            <div 
                key={match.id} 
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate('/matches')}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            {homeCrest ? (
                                <img src={homeCrest} alt={homeName} className="w-6 h-6 object-contain" />
                            ) : (
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                    {homeName.charAt(0)}
                                </div>
                            )}
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{homeName}</span>
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-xs">vs</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{awayName}</span>
                            {awayCrest ? (
                                <img src={awayCrest} alt={awayName} className="w-6 h-6 object-contain" />
                            ) : (
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                    {awayName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {timeStr}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const currentLeagueMatches = selectedLeague ? matches[selectedLeague] || [] : []
    const leagueConfig = selectedLeague ? getLeagueConfig(selectedLeague) : null
    const LeagueIcon = leagueConfig?.icon || Globe

    const visibleBanners = announcements.filter(a => 
        a.type === 'banner' && 
        !dismissedAnnouncements.includes(a.id)
    )

    const visibleNotifications = announcements.filter(a => 
        a.type === 'notification' && 
        !dismissedAnnouncements.includes(a.id)
    )

    const getAnnouncementIcon = (type, priority) => {
        if (type === 'popup') {
            return priority === 'high' ? AlertCircle : Info
        }
        if (type === 'notification') {
            return Bell
        }
        return Megaphone
    }

    const getPriorityColors = (priority) => {
        switch(priority) {
            case 'high':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                    text: 'text-red-700 dark:text-red-300',
                    icon: AlertTriangle,
                    iconColor: 'text-red-600 dark:text-red-400'
                }
            case 'normal':
                return {
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                    border: 'border-yellow-200 dark:border-yellow-800',
                    text: 'text-yellow-700 dark:text-yellow-300',
                    icon: Info,
                    iconColor: 'text-yellow-600 dark:text-yellow-400'
                }
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-700 dark:text-blue-300',
                    icon: Info,
                    iconColor: 'text-blue-600 dark:text-blue-400'
                }
        }
    }

    return (
        <div>
            {popupAnnouncement && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${getPriorityColors(popupAnnouncement.priority).bg} ${getPriorityColors(popupAnnouncement.priority).border} border`}>
                                {React.createElement(getAnnouncementIcon('popup', popupAnnouncement.priority), {
                                    size: 24,
                                    className: getPriorityColors(popupAnnouncement.priority).iconColor
                                })}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {popupAnnouncement.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-2">
                                    {popupAnnouncement.content}
                                </p>
                                {popupAnnouncement.end_date && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                                        Valid until {new Date(popupAnnouncement.end_date).toLocaleDateString()}
                                    </p>
                                )}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => dismissAnnouncement(popupAnnouncement.id)}
                                        className="flex-1 bg-gray-800 dark:bg-white text-white dark:text-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition"
                                    >
                                        Got it
                                    </button>
                                    <button
                                        onClick={() => setPopupAnnouncement(null)}
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loadingAnnouncements && visibleBanners.length > 0 && (
                <div className="mb-4 space-y-2">
                    {visibleBanners.map((announcement) => {
                        const colors = getPriorityColors(announcement.priority)
                        const Icon = getAnnouncementIcon('banner', announcement.priority)
                        
                        return (
                            <div key={announcement.id} className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-1.5 rounded-full ${colors.bg} border ${colors.border} flex-shrink-0 mt-0.5`}>
                                        <Icon size={18} className={colors.iconColor} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className={`font-bold ${colors.text}`}>{announcement.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {announcement.content}
                                        </p>
                                    </div>
                                    <button onClick={() => dismissAnnouncement(announcement.id)} className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 transition-colors duration-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-gray-600 dark:text-gray-400" size={24} />
                            {t('welcome') || 'Welcome'}, {profile?.full_name || 'Predictor'}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {t('predictions') || 'Predict matches'} and {t('points') || 'earn points'}
                        </p>
                    </div>
                    <Link 
                        to="/leaderboard"
                        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                    >
                        <Trophy size={16} /> Premium Predictions
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                        <Trophy size={14} />
                        <p className="text-xs">Points</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{profile?.points || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                        <Target size={14} />
                        <p className="text-xs">Predictions</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{profile?.predictions_count || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                        <TrendingUp size={14} />
                        <p className="text-xs">Accuracy</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{profile?.accuracy || 0}%</p>
                </div>
            </div>

            <div className="mb-4 overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
                    {Object.entries(COMPETITIONS).map(([key, id]) => {
                        const config = getLeagueConfig(id)
                        const count = leagueMatchCounts[id] || 0
                        const isSelected = selectedLeague === id
                        const Icon = config.icon
                        
                        return (
                            <button
                                key={id}
                                onClick={() => setSelectedLeague(id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition whitespace-nowrap ${
                                    isSelected 
                                        ? `${config.selectedBg} text-white border-transparent` 
                                        : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500`
                                }`}
                            >
                                <Icon size={16} className={isSelected ? 'text-white' : config.iconColor} />
                                <span className="text-sm font-medium">{config.country}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    isSelected 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {weekDates.map((date, index) => {
                    const isActive = date.toDateString() === selectedDate.toDateString()
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNum = date.getDate()
                    
                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center px-4 py-2 rounded-lg border transition min-w-[60px] ${
                                isActive 
                                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800 border-gray-800 dark:border-white' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                            }`}
                        >
                            <span className="text-xs font-medium">{dayName}</span>
                            <span className="text-lg font-bold">{dayNum}</span>
                            {isToday(date) && (
                                <span className="text-[8px] uppercase bg-green-500 text-white px-1 rounded mt-0.5">Today</span>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                {loading ? (
                    <div className="text-center py-8">
                        <Loader className="w-8 h-8 text-gray-300 dark:text-gray-600 animate-spin mx-auto" />
                        <p className="text-gray-400 dark:text-gray-500 mt-2">Loading matches...</p>
                    </div>
                ) : (
                    <>
                        {leagueConfig && (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${leagueConfig.bgColor}`}>
                                        <LeagueIcon size={20} className={leagueConfig.iconColor} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-800 dark:text-white">{leagueConfig.name}</h2>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{leagueConfig.country}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                    {currentLeagueMatches.length} matches
                                </span>
                            </div>
                        )}

                        {currentLeagueMatches.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                                <p>No matches scheduled for this day</p>
                                <p className="text-sm mt-1">Check another date or league</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {currentLeagueMatches.map(renderMatchCard)}
                            </div>
                        )}

                        {currentLeagueMatches.length > 0 && (
                            <Link 
                                to="/matches"
                                className="block text-center mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                            >
                                View all matches →
                            </Link>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}