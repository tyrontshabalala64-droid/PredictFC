 import axios from 'axios'
import { supabase } from '../lib/supabase'

const FOOTBALL_DATA_KEY = '5ac44b9e7ae64f30891be70bacd04900'
const FOOTBALL_DATA_URL = 'https://api.football-data.org/v4'

// ✅ MULTIPLE FALLBACK PROXIES (Try these in order)
const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/'
]

export const COMPETITIONS = {
    PREMIER_LEAGUE: 'PL',
    LA_LIGA: 'PD',
    BUNDESLIGA: 'BL1',
    SERIE_A: 'SA',
    LIGUE_1: 'FL1',
    CHAMPIONS_LEAGUE: 'CL',
    WORLD_CUP: 'WC',
    EREDIVISIE: 'DED',
    BRAZIL_SERIE_A: 'BSA',
    CHAMPIONSHIP: 'ELC',
    PRIMEIRA_LIGA: 'PPL',
    EUROPEAN_CHAMPIONSHIP: 'EC',
}

// ✅ CACHE LENGTH: 1 hour (3600 seconds)
const CACHE_DURATION = 3600

// ✅ Fetch matches with database caching + multiple proxy fallbacks
export async function getTodaysMatches(competition = 'PL') {
    try {
        // 1. Check if we have a cached version in Supabase
        const cacheKey = `matches-${competition}`
        const { data: cachedData } = await supabase
            .from('match_cache')
            .select('data, created_at')
            .eq('id', cacheKey)
            .maybeSingle()

        // 2. If cache is fresh (less than 1 hour old), use it
        if (cachedData?.data && cachedData?.created_at) {
            const cacheAge = Date.now() - new Date(cachedData.created_at).getTime()
            if (cacheAge < CACHE_DURATION * 1000) {
                console.log(`✅ Using cached data for ${competition}`)
                return cachedData.data
            }
        }

        // 3. Try each proxy until one works
        let matchesResponse = null
        let standingsResponse = null
        let lastError = null

        for (const proxy of PROXIES) {
            try {
                const today = new Date()
                const future = new Date()
                future.setDate(today.getDate() + 10)

                const dateFrom = today.toISOString().split('T')[0]
                const dateTo = future.toISOString().split('T')[0]

                const matchesUrl = `${FOOTBALL_DATA_URL}/competitions/${competition}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
                const standingsUrl = `${FOOTBALL_DATA_URL}/competitions/${competition}/standings`

                const [matchesRes, standingsRes] = await Promise.all([
                    axios.get(`${proxy}${encodeURIComponent(matchesUrl)}`, {
                        headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
                    }),
                    axios.get(`${proxy}${encodeURIComponent(standingsUrl)}`, {
                        headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
                    })
                ])

                if (matchesRes.data?.matches) {
                    matchesResponse = matchesRes
                    standingsResponse = standingsRes
                    console.log(`✅ Using proxy: ${proxy}`)
                    break
                }
            } catch (error) {
                lastError = error
                console.warn(`❌ Proxy failed: ${proxy}`)
            }
        }

        // If no proxy worked, return cached data
        if (!matchesResponse || !standingsResponse) {
            console.error('All proxies failed:', lastError)
            
            // Try to return cached version even if expired
            const { data: fallbackData } = await supabase
                .from('match_cache')
                .select('data')
                .eq('id', cacheKey)
                .maybeSingle()

            if (fallbackData?.data) {
                console.log(`✅ Using expired cache for ${competition} (fallback)`)
                return fallbackData.data
            }

            return { matches: [], standingsMap: {} }
        }

        // 4. Extract standings
        const standingsMap = {}
        const table = standingsResponse.data?.standings?.[0]?.table || []
        table.forEach(row => {
            standingsMap[row.team?.id] = {
                position: row.position,
                played: row.playedGames || 0,
                won: row.won || 0,
                drawn: row.drawn || 0,
                lost: row.lost || 0,
                points: row.points || 0,
                goalsFor: row.goalsFor || 0,
                goalsAgainst: row.goalsAgainst || 0
            }
        })

        const result = {
            matches: matchesResponse.data?.matches || [],
            standingsMap
        }

        // 5. Save to cache for 1 hour
        await supabase
            .from('match_cache')
            .upsert({ id: cacheKey, data: result, created_at: new Date().toISOString() })

        return result

    } catch (error) {
        console.error('Error fetching matches:', error)
        return { matches: [], standingsMap: {} }
    }
}

// ✅ FORMAT MATCH FOR DISPLAY
export function formatMatch(match) {
    const homeTeam = match.homeTeam || {}
    const awayTeam = match.awayTeam || {}
    const competition = match.competition || {}

    let status = 'upcoming'
    const matchStatus = match.status || ''
    if (matchStatus === 'FINISHED' || matchStatus === 'FT') status = 'finished'
    else if (matchStatus === 'LIVE' || matchStatus === 'IN_PLAY') status = 'live'

    let homeScore = 0
    let awayScore = 0
    if (match.score?.fullTime?.home !== null && match.score?.fullTime?.home !== undefined) {
        homeScore = match.score.fullTime.home
        awayScore = match.score.fullTime.away
    }

    return {
        id: match.id || `match-${Math.random()}`,
        matchId: match.id || `match-${Math.random()}`,
        homeTeam: {
            name: homeTeam.name || 'Unknown',
            crest: homeTeam.crest || null,
            id: homeTeam.id || null
        },
        awayTeam: {
            name: awayTeam.name || 'Unknown',
            crest: awayTeam.crest || null,
            id: awayTeam.id || null
        },
        league: competition.name || 'Unknown League',
        leagueId: competition.code || 'unknown',
        kickoff: match.utcDate || new Date().toISOString(),
        status: status,
        score: {
            home: homeScore || 0,
            away: awayScore || 0
        },
        venue: match.venue || 'Unknown Venue'
    }
}