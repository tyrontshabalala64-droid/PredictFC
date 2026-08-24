 // ============================================
// PREDICTION ENGINE (Daily Deterministic)
// ============================================

// Generate a stable seed based on match ID + date
function generateSeed(matchId) {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const seedString = `${matchId}-${today}`
    let seed = 0
    for (let i = 0; i < seedString.length; i++) {
        seed = ((seed << 5) - seed) + seedString.charCodeAt(i)
        seed |= 0
    }
    return Math.abs(seed)
}

// Seeded random function (returns 0 to 1)
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

// Calculate strength from team stats
function calculateStrength(stats) {
    if (!stats) return 50
    const played = stats.played || 1
    const winRate = (stats.won || 0) / played
    const goalDiff = (stats.goalsFor || 0) - (stats.goalsAgainst || 0)
    const points = stats.points || 0
    const strength = (winRate * 40) + (points * 0.5) + (goalDiff * 2)
    return Math.max(10, Math.min(90, strength))
}

// Calculate confidence
function calculateConfidence(homeStrength, awayStrength) {
    const strengthDiff = Math.abs(homeStrength - awayStrength)
    if (strengthDiff > 30) return 'High'
    if (strengthDiff > 15) return 'Medium'
    return 'Low'
}

// ✅ MAIN PREDICTION FUNCTION (Stable for the day)
export function generatePrediction(matchId, homeStats, awayStats) {
    const seed = generateSeed(matchId)
    const random = seededRandom(seed)

    const homeStrength = calculateStrength(homeStats)
    const awayStrength = calculateStrength(awayStats)

    // Match Result (1X2)
    let matchResult = 'Draw'
    if (homeStrength > awayStrength * 1.2) matchResult = 'Home Win'
    else if (awayStrength > homeStrength * 1.2) matchResult = 'Away Win'

    // Over/Under 2.5
    const homeGoals = homeStats?.goalsFor || 0
    const awayGoals = awayStats?.goalsFor || 0
    const totalAvgGoals = (homeGoals + awayGoals) / 2
    let overUnder = 'Under 2.5'
    if (totalAvgGoals > 2.5) overUnder = 'Over 2.5'

    // BTTS
    const homeScored = homeGoals >= 1
    const awayScored = awayGoals >= 1
    let btts = 'No'
    if (homeScored && awayScored) btts = 'Yes'

    // Hybrid Twist (Using seed, not Math.random)
    // 10% chance to change one prediction
    if (random < 0.1) {
        matchResult = matchResult === 'Home Win' ? 'Draw' : matchResult === 'Draw' ? 'Away Win' : 'Home Win'
    } else if (random < 0.2) {
        overUnder = overUnder === 'Over 2.5' ? 'Under 2.5' : 'Over 2.5'
    } else if (random < 0.3) {
        btts = btts === 'Yes' ? 'No' : 'Yes'
    }

    const confidence = calculateConfidence(homeStrength, awayStrength)

    return {
        matchResult,
        overUnder,
        btts,
        confidence
    }
}