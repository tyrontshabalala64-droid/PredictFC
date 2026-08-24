 import { supabase } from '../lib/supabase'

const FOOTBALL_DATA_KEY = '5ac44b9e7ae64f30891be70bacd04900'

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

export async function getTodaysMatches(competition = 'PL') {
    try {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
        const functionUrl = `${supabaseUrl}/functions/v1/get-matches?competition=${competition}`

        const response = await fetch(functionUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            }
        })

        if (!response.ok) {
            console.error('Edge function error:', response.status)
            return { matches: [], standingsMap: {} }
        }

        const data = await response.json()

        return {
            matches: data.matches || [],
            standingsMap: data.standingsMap || {}
        }
    } catch (error) {
        console.error('Error fetching matches:', error)
        return { matches: [], standingsMap: {} }
    }
}

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