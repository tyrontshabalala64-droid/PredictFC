 // src/services/oddsService.js

/**
 * Generate mocked odds for a match
 * In the future, this will fetch from The Odds API
 */
export function getMockOdds(matchId, homeTeam, awayTeam) {
  // Use the matchId to generate consistent odds for testing
  const seed = matchId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Deterministic random generator using the seed
  const seededRandom = (min, max) => {
    const x = Math.sin(seed + 1) * 10000
    const r = x - Math.floor(x)
    return min + (max - min) * r
  }

  return {
    match_result: {
      label: 'Match Result',
      options: [
        { pick: 'Home Win', odds: seededRandom(1.50, 2.50) },
        { pick: 'Draw', odds: seededRandom(3.00, 4.00) },
        { pick: 'Away Win', odds: seededRandom(2.50, 5.00) }
      ]
    },
    over_under_25: {
      label: 'Over/Under 2.5 Goals',
      options: [
        { pick: 'Over 2.5', odds: seededRandom(1.70, 2.20) },
        { pick: 'Under 2.5', odds: seededRandom(1.70, 2.20) }
      ]
    },
    btts: {
      label: 'Both Teams to Score',
      options: [
        { pick: 'Yes', odds: seededRandom(1.60, 2.00) },
        { pick: 'No', odds: seededRandom(1.80, 2.30) }
      ]
    },
    corners: {
      label: 'Total Corners',
      options: [
        { pick: 'Over 9.5', odds: seededRandom(1.90, 2.50) },
        { pick: 'Under 9.5', odds: seededRandom(1.50, 2.00) }
      ]
    },
    total_goals_15: {
      label: 'Total Goals (1.5)',
      options: [
        { pick: 'Over 1.5', odds: seededRandom(1.30, 1.80) },
        { pick: 'Under 1.5', odds: seededRandom(2.00, 3.00) }
      ]
    }
  }
}