 import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Flame, 
  ChevronRight, 
  Clock,
  MessageCircle,
  TrendingUp
} from 'lucide-react'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import PostCard from '../components/PostCard'
import BouncingLoader from '../components/BouncingLoader'
import AdminHighlights from '../components/AdminHighlights'

// ============================================
// TRENDING MATCHES SECTION
// ============================================
function TrendingMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState(COMPETITIONS.PREMIER_LEAGUE)
  const scrollRef = useRef(null)

  const leagues = [
    { id: COMPETITIONS.PREMIER_LEAGUE, name: 'EPL', icon: '🏴' },
    { id: COMPETITIONS.LA_LIGA, name: 'LaLiga', icon: '🇪🇸' },
    { id: COMPETITIONS.BUNDESLIGA, name: 'Bundes', icon: '🇩🇪' },
    { id: COMPETITIONS.SERIE_A, name: 'Serie A', icon: '🇮🇹' },
    { id: COMPETITIONS.LIGUE_1, name: 'Ligue 1', icon: '🇫🇷' },
    { id: COMPETITIONS.CHAMPIONS_LEAGUE, name: 'UCL', icon: '🌟' },
  ]

  useEffect(() => {
    loadMatches()
  }, [selectedLeague])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const { matches: matchesData } = await getTodaysMatches(selectedLeague)
      const formatted = matchesData.slice(0, 10).map(m => formatMatch(m))
      setMatches(formatted)
    } catch (error) {
      console.error('Error loading matches:', error)
      setMatches([])
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
            <Flame size={20} className="text-orange-500" /> Trending Matches
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1,2,3,4].map(i => (
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

  if (matches.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Flame size={20} className="text-orange-500" /> Trending Matches
          </h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm">No matches scheduled today</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Flame size={20} className="text-orange-500" /> Trending Matches
        </h2>
        <Link to="/matches" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          See All <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {leagues.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedLeague === league.id
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {league.icon} {league.name}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 border border-gray-200"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md items-center justify-center hover:bg-gray-50 border border-gray-200"
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ============================================
// SINGLE MATCH CARD
// ============================================
function MatchCard({ match }) {
  const homeName = match.homeTeam?.name || 'Unknown'
  const awayName = match.awayTeam?.name || 'Unknown'
  const homeCrest = match.homeTeam?.crest
  const awayCrest = match.awayTeam?.crest
  const matchDate = match.kickoff ? new Date(match.kickoff) : new Date()
  const timeStr = matchDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  const isLive = match.status === 'live'

  return (
    <Link
      to={`/matches`}
      className="min-w-[160px] max-w-[180px] bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition flex-shrink-0"
      style={{ scrollSnapAlign: 'start' }}
    >
      {isLive && (
        <div className="flex items-center gap-1 mb-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-red-500 uppercase">Live</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-1">
        {homeCrest ? (
          <img src={homeCrest} alt={homeName} className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
            {homeName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-medium text-gray-800 truncate flex-1">{homeName}</span>
      </div>

      <div className="flex items-center gap-2">
        {awayCrest ? (
          <img src={awayCrest} alt={awayName} className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-600">
            {awayName.charAt(0)}
          </div>
        )}
        <span className="text-sm font-medium text-gray-800 truncate flex-1">{awayName}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {timeStr}
        </span>
        <span className="bg-gray-100 px-2 py-0.5 rounded-full">{match.league || 'Unknown'}</span>
      </div>
    </Link>
  )
}

// ============================================
// ANNOUNCEMENT BANNER
// ============================================
function AnnouncementBanner({ announcement, onDismiss }) {
  if (!announcement) return null

  const getBgColor = () => {
    switch(announcement.priority) {
      case 'high': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'normal': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      default: return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    }
  }

  const getTextColor = () => {
    switch(announcement.priority) {
      case 'high': return 'text-red-700 dark:text-red-300'
      case 'normal': return 'text-yellow-700 dark:text-yellow-300'
      default: return 'text-blue-700 dark:text-blue-300'
    }
  }

  return (
    <div className={`rounded-xl border p-3 mb-4 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${getTextColor()}`}>
            {announcement.title}
          </h4>
          <p className={`text-sm ${getTextColor()} opacity-90 mt-0.5`}>
            {announcement.content}
          </p>
          {announcement.end_date && (
            <p className="text-xs opacity-60 mt-1">
              Valid until {new Date(announcement.end_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ============================================
// MAIN HOME PAGE
// ============================================
export default function Home() {
  const [feedPosts, setFeedPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
    setDismissedAnnouncements(dismissed)
  }, [])

  // Load announcements
  useEffect(() => {
    loadAnnouncements()
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

      if (error) {
        console.warn('Error loading announcements:', error)
        setAnnouncements([])
        setLoadingAnnouncements(false)
        return
      }

      setAnnouncements(data || [])
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
  }

  const loadFeed = async () => {
    setLoadingFeed(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, is_verified),
          reactions:post_reactions (id, user_id, type)
        `)
        .order('created_at', { ascending: false })
        .limit(7)

      if (error) throw error
      setFeedPosts(data || [])
    } catch (error) {
      console.error('Error loading feed:', error)
      setFeedPosts([])
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id))

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-20">
      {/* Announcements Section */}
      {!loadingAnnouncements && visibleAnnouncements.length > 0 && (
        <div className="mb-4">
          {visibleAnnouncements.map((announcement) => (
            <AnnouncementBanner
              key={announcement.id}
              announcement={announcement}
              onDismiss={() => dismissAnnouncement(announcement.id)}
            />
          ))}
        </div>
      )}

      {/* Trending Matches Section */}
      <TrendingMatches />

      {/* ✅ Admin Highlights Section - NEW */}
      <AdminHighlights />

      {/* Feed Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Latest Feed
          </h2>
          <Link to="/feed" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            See All <ChevronRight size={16} />
          </Link>
        </div>

        {loadingFeed ? (
          <div className="flex justify-center py-12">
            <BouncingLoader size="lg" color="green" text="Loading posts..." />
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <MessageCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No posts yet</p>
            <p className="text-xs text-gray-300">Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onRefresh={loadFeed}
                currentUser={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}