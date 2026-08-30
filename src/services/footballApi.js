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
    PSL: 'PSL',
}

export const LEAGUE_INFO = {
    PL: { name: 'Premier League', icon: '🏴', code: 'PL' },
    PD: { name: 'La Liga', icon: '🇪🇸', code: 'PD' },
    BL1: { name: 'Bundesliga', icon: '🇩🇪', code: 'BL1' },
    SA: { name: 'Serie A', icon: '🇮🇹', code: 'SA' },
    FL1: { name: 'Ligue 1', icon: '🇫🇷', code: 'FL1' },
    CL: { name: 'Champions League', icon: '🌟', code: 'CL' },
    PSL: { name: 'PSL', icon: '🇿🇦', code: 'PSL' },
}

export async function getTodaysMatches(competition = 'PL') {
    try {
        // ✅ If PSL, use the PSL scraper endpoint
        if (competition === COMPETITIONS.PSL) {
            console.log('🔵 Loading PSL matches...')
            return await getPSLMatches()
        }

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

// ============================================
// PSL MATCHES - USING SCRAPER EDGE FUNCTION
// ============================================
export async function getPSLMatches() {
    try {
        console.log('📅 Fetching PSL matches from scraper...')
        
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
        const functionUrl = `${supabaseUrl}/functions/v1/get-psl-matches`

        const response = await fetch(functionUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
            }
        })

        if (!response.ok) {
            console.error('PSL scraper error:', response.status)
            // Fallback to hardcoded matches
            return getHardcodedPSLMatches()
        }

        const data = await response.json()
        console.log('📊 PSL data received:', data)
        
        if (!data.success || !data.matches || data.matches.length === 0) {
            console.warn('No matches from scraper, using hardcoded fallback')
            return getHardcodedPSLMatches()
        }

        // Format PSL matches to match your existing structure
        const formattedMatches = (data.matches || []).map(match => ({
            id: match.id || `psl-${Date.now()}-${Math.random()}`,
            homeTeam: {
                name: match.homeTeam?.name || match.homeTeam || 'Unknown',
                crest: match.homeTeam?.crest || null,
                id: match.homeTeam?.id || null
            },
            awayTeam: {
                name: match.awayTeam?.name || match.awayTeam || 'Unknown',
                crest: match.awayTeam?.crest || null,
                id: match.awayTeam?.id || null
            },
            competition: {
                name: 'PSL',
                code: 'PSL'
            },
            league: 'PSL',
            leagueId: 'PSL',
            kickoff: match.kickoff || match.date || new Date().toISOString(),
            status: match.status || 'SCHEDULED',
            score: {
                home: match.score?.home || match.homeScore || 0,
                away: match.score?.away || match.awayScore || 0
            },
            venue: match.venue || 'TBD',
            utcDate: match.kickoff || match.date || new Date().toISOString()
        }))

        console.log(`✅ Found ${formattedMatches.length} PSL matches`)
        
        return {
            matches: formattedMatches,
            standingsMap: {},
            source: 'PSL Scraper'
        }

    } catch (error) {
        console.error('Error fetching PSL matches:', error)
        return getHardcodedPSLMatches()
    }
}

// ============================================
// HARDCODED PSL MATCHES (FALLBACK)
// ============================================
export function getHardcodedPSLMatches() {
    console.log('📅 Using hardcoded PSL matches...')
    
    const today = new Date()
    const matches = []
    
    // PSL Teams
    const teams = [
        'Mamelodi Sundowns',
        'Orlando Pirates',
        'Kaizer Chiefs',
        'SuperSport United',
        'Cape Town City',
        'Stellenbosch FC',
        'Polokwane City',
        'Sekhukhune United',
        'Golden Arrows',
        'Royal AM',
        'TS Galaxy',
        'AmaZulu',
        'Chippa United',
        'Richards Bay',
        'Magesi FC',
        'Moroka Swallows'
    ]
    
    const venues = [
        'Loftus Versfeld Stadium',
        'Orlando Stadium',
        'FNB Stadium',
        'Moses Mabhida Stadium',
        'Cape Town Stadium',
        'Peter Mokaba Stadium',
        'Durban Stadium',
        'Ellis Park Stadium'
    ]
    
    // Generate 5 upcoming matches
    for (let i = 0; i < 5; i++) {
        const homeIdx = (i * 2) % teams.length
        const awayIdx = (i * 2 + 1) % teams.length
        const date = new Date(today)
        date.setDate(date.getDate() + (i + 1) * 2)
        date.setHours(15 + (i % 3) * 2, 30, 0, 0)
        
        matches.push({
            id: `psl-hardcoded-${i}`,
            homeTeam: {
                name: teams[homeIdx],
                crest: null
            },
            awayTeam: {
                name: teams[awayIdx],
                crest: null
            },
            competition: {
                name: 'PSL',
                code: 'PSL'
            },
            league: 'PSL',
            leagueId: 'PSL',
            kickoff: date.toISOString(),
            status: 'SCHEDULED',
            score: {
                home: 0,
                away: 0
            },
            venue: venues[i % venues.length],
            utcDate: date.toISOString()
        })
    }
    
    console.log(`✅ Generated ${matches.length} hardcoded PSL matches`)
    
    return {
        matches: matches,
        standingsMap: {},
        source: 'Hardcoded Fallback'
    }
}

// ============================================
// GET PSL TEAMS
// ============================================
export async function getPSLTeams() {
    try {
        const { data, error } = await supabase
            .from('psl_teams')
            .select('*')
            .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
            return data
        }

        // Fallback: Hardcoded PSL teams
        return [
            { name: 'Mamelodi Sundowns', crest: null, city: 'Pretoria' },
            { name: 'Orlando Pirates', crest: null, city: 'Johannesburg' },
            { name: 'Kaizer Chiefs', crest: null, city: 'Johannesburg' },
            { name: 'SuperSport United', crest: null, city: 'Pretoria' },
            { name: 'Cape Town City', crest: null, city: 'Cape Town' },
            { name: 'Stellenbosch FC', crest: null, city: 'Stellenbosch' },
            { name: 'Polokwane City', crest: null, city: 'Polokwane' },
            { name: 'Sekhukhune United', crest: null, city: 'Polokwane' },
            { name: 'Golden Arrows', crest: null, city: 'Durban' },
            { name: 'Royal AM', crest: null, city: 'Pietermaritzburg' },
            { name: 'TS Galaxy', crest: null, city: 'Krugersdorp' },
            { name: 'AmaZulu', crest: null, city: 'Durban' },
            { name: 'Chippa United', crest: null, city: 'Gqeberha' },
            { name: 'Richards Bay', crest: null, city: 'Richards Bay' },
            { name: 'Magesi FC', crest: null, city: 'Limpopo' },
            { name: 'Moroka Swallows', crest: null, city: 'Johannesburg' }
        ]
    } catch (error) {
        console.error('Error fetching PSL teams:', error)
        return []
    }
}

// ============================================
// GET PSL STANDINGS
// ============================================
export async function getPSLStandings() {
    try {
        const { data, error } = await supabase
            .from('psl_standings')
            .select('*')
            .order('position', { ascending: true })

        if (!error && data && data.length > 0) {
            return data
        }
        return []
    } catch (error) {
        console.error('Error fetching PSL standings:', error)
        return []
    }
}

// ============================================
// GET PSL MATCHES FROM DATABASE (FALLBACK)
// ============================================
export async function getPSLMatchesFromDB() {
    try {
        console.log('📅 Fetching PSL matches from database...')
        
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('league', 'PSL')
            .gte('kickoff', new Date().toISOString())
            .order('kickoff', { ascending: true })
            .limit(20)

        if (error) throw error

        if (!data || data.length === 0) {
            return getHardcodedPSLMatches()
        }

        const formattedMatches = (data || []).map(match => ({
            id: match.id || `psl-${Date.now()}-${Math.random()}`,
            homeTeam: {
                name: match.home_team || 'Unknown',
                crest: match.home_crest || null,
                id: match.home_team_id || null
            },
            awayTeam: {
                name: match.away_team || 'Unknown',
                crest: match.away_crest || null,
                id: match.away_team_id || null
            },
            competition: {
                name: 'PSL',
                code: 'PSL'
            },
            league: 'PSL',
            leagueId: 'PSL',
            kickoff: match.kickoff || new Date().toISOString(),
            status: match.status || 'SCHEDULED',
            score: {
                home: match.home_score || 0,
                away: match.away_score || 0
            },
            venue: match.venue || 'TBD',
            utcDate: match.kickoff || new Date().toISOString()
        }))

        return {
            matches: formattedMatches,
            standingsMap: {}
        }

    } catch (error) {
        console.error('Error fetching PSL matches from DB:', error)
        return getHardcodedPSLMatches()
    }
}

// ============================================
// FORMAT MATCH FUNCTION
// ============================================
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

    // If it's a PSL match, use the league field directly
    const leagueName = match.league || competition.name || 'Unknown League'
    const leagueCode = match.leagueId || competition.code || 'unknown'

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
        league: leagueName,
        leagueId: leagueCode,
        kickoff: match.utcDate || match.kickoff || new Date().toISOString(),
        status: status,
        score: {
            home: homeScore || match.score?.home || 0,
            away: awayScore || match.score?.away || 0
        },
        venue: match.venue || 'Unknown Venue'
    }
}