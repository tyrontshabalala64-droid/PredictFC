 import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Flame, 
  ChevronRight, 
  Clock,
  Calendar,
  Trophy,
  Users,
  MessageCircle,
  Heart,
  TrendingUp
} from 'lucide-react'
import { getTodaysMatches, formatMatch, COMPETITIONS } from '../services/footballApi'
import PostCard from '../components/PostCard'
import { SkeletonCard } from '../components/Skeleton'

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
            <div key={i} className="min-w-[200px] bg-white rounded-xl shadow-sm p-4 animate-pulse">
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
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Flame size={20} className="text-orange-500" /> Trending Matches
        </h2>
        <Link to="/matches" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          See All <ChevronRight size={16} />
        </Link>
      </div>

      {/* League Tabs - Horizontal Scroll */}
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

      {/* Match Cards - Horizontal Scroll */}
      <div className="relative">
        {/* Left Scroll Button - Desktop only */}
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

        {/* Right Scroll Button - Desktop only */}
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

      {/* Home Team */}
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

      {/* Away Team */}
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

      {/* Time */}
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
// MAIN HOME PAGE
// ============================================
export default function Home() {
  const { profile } = useAuth()
  const [feedPosts, setFeedPosts] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  // Load latest feed posts
  useEffect(() => {
    loadFeed()
  }, [])

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-20">
      {/* Trending Matches Section */}
      <TrendingMatches />

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
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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