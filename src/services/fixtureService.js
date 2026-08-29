 // src/services/fixtureService.js

export const COMPETITIONS = {
    PREMIER_LEAGUE: 'PL',
    LA_LIGA: 'PD',
    BUNDESLIGA: 'BL1',
    SERIE_A: 'SA',
    LIGUE_1: 'FL1',
    CHAMPIONS_LEAGUE: 'CL',
}

export const LEAGUE_INFO = {
    PL: { name: 'Premier League', icon: '🏴', code: 'PL' },
    PD: { name: 'La Liga', icon: '🇪🇸', code: 'PD' },
    BL1: { name: 'Bundesliga', icon: '🇩🇪', code: 'BL1' },
    SA: { name: 'Serie A', icon: '🇮🇹', code: 'SA' },
    FL1: { name: 'Ligue 1', icon: '🇫🇷', code: 'FL1' },
    CL: { name: 'Champions League', icon: '🌟', code: 'CL' },
}

// ✅ LOCAL FIXTURE DATA - This is what we're using
const LOCAL_FIXTURES = {
    PL: [
        { home: 'Arsenal', away: 'Tottenham', date: 'Sat 28 Aug', time: '20:00' },
        { home: 'Liverpool', away: 'Everton', date: 'Sat 28 Aug', time: '17:30' },
        { home: 'Manchester City', away: 'Bournemouth', date: 'Sat 28 Aug', time: '15:00' },
        { home: 'Chelsea', away: 'Fulham', date: 'Sat 28 Aug', time: '12:30' },
        { home: 'Manchester United', away: 'Brighton', date: 'Sun 29 Aug', time: '16:30' },
        { home: 'Newcastle', away: 'Aston Villa', date: 'Sun 29 Aug', time: '14:00' },
        { home: 'Wolves', away: 'West Ham', date: 'Mon 30 Aug', time: '20:00' },
    ],
    PD: [
        { home: 'Barcelona', away: 'Real Madrid', date: 'Sat 28 Aug', time: '21:00' },
        { home: 'Atletico Madrid', away: 'Sevilla', date: 'Sat 28 Aug', time: '18:30' },
        { home: 'Real Sociedad', away: 'Athletic Club', date: 'Sun 29 Aug', time: '21:00' },
    ],
    BL1: [
        { home: 'Bayern Munich', away: 'Borussia Dortmund', date: 'Sat 28 Aug', time: '18:30' },
        { home: 'RB Leipzig', away: 'Bayer Leverkusen', date: 'Sat 28 Aug', time: '15:30' },
    ],
    SA: [
        { home: 'AC Milan', away: 'Inter Milan', date: 'Sat 28 Aug', time: '20:45' },
        { home: 'Juventus', away: 'Roma', date: 'Sat 28 Aug', time: '18:00' },
    ],
    FL1: [
        { home: 'PSG', away: 'Marseille', date: 'Sat 28 Aug', time: '21:00' },
        { home: 'Lyon', away: 'Lille', date: 'Sat 28 Aug', time: '17:00' },
    ],
    CL: [
        { home: 'Real Madrid', away: 'Liverpool', date: 'Tue 31 Aug', time: '21:00' },
        { home: 'Bayern Munich', away: 'PSG', date: 'Wed 1 Sep', time: '21:00' },
    ]
}

// ✅ ALWAYS RETURNS LOCAL DATA FOR NOW
export async function getUpcomingFixtures(competitionId = 'PL', limit = 20) {
    console.log('🔵 getUpcomingFixtures called for:', competitionId)
    
    const fixtures = LOCAL_FIXTURES[competitionId] || LOCAL_FIXTURES.PL
    const limited = fixtures.slice(0, limit)
    
    console.log('✅ Returning', limited.length, 'fixtures for', competitionId)
    
    return limited.map((f, index) => ({
        id: `fixture-${competitionId}-${index}-${Date.now()}`,
        homeTeam: { name: f.home, crest: null },
        awayTeam: { name: f.away, crest: null },
        competition: { 
            name: LEAGUE_INFO[competitionId]?.name || 'Unknown', 
            code: competitionId 
        },
        utcDate: new Date().toISOString(),
        status: 'SCHEDULED',
        venue: 'Stadium'
    }))
}

export function formatFixture(match) {
    const homeTeam = match.homeTeam || {}
    const awayTeam = match.awayTeam || {}
    const competition = match.competition || {}

    const matchDate = match.utcDate ? new Date(match.utcDate) : new Date()
    const dateStr = matchDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
    })
    const timeStr = matchDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    })

    let status = 'scheduled'
    if (match.status === 'FINISHED' || match.status === 'FT') status = 'finished'
    else if (match.status === 'LIVE' || match.status === 'IN_PLAY') status = 'live'

    return {
        id: match.id || `match-${Date.now()}`,
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
        competition: {
            name: competition.name || 'Unknown League',
            code: competition.code || 'unknown'
        },
        date: matchDate,
        dateStr: dateStr,
        time: timeStr,
        status: status,
        score: {
            home: match.score?.fullTime?.home || null,
            away: match.score?.fullTime?.away || null
        },
        venue: match.venue || 'Unknown Venue'
    }
}

export function groupFixturesByDate(fixtures) {
    const groups = {}
    fixtures.forEach(fixture => {
        const dateKey = fixture.dateStr
        if (!groups[dateKey]) {
            groups[dateKey] = []
        }
        groups[dateKey].push(fixture)
    })
    return groups
}