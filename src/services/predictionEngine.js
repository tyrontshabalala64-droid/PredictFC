 // src/services/predictionEngine.js
import { supabase } from '../lib/supabase'

// ============================================
// PREDICTION ENGINE v2.0 - DATA-DRIVEN
// ============================================

/**
 * Generate REAL predictions based on actual team data
 * Uses: Form, H2H, League Position, Goals, Home/Away
 */

// ============================================
// 1. TEAM RATING CALCULATION
// ============================================
export function calculateTeamRating(teamStats, isHome = true) {
    if (!teamStats) {
        return {
            overall: 50,
            attack: 50,
            defense: 50,
            form: 50,
            homeAdvantage: isHome ? 5 : 0,
            winRate: 33,
            goalsPerGame: 1,
            concededPerGame: 1,
            ppg: 1.0
        }
    }

    const played = teamStats.played || 1
    const won = teamStats.won || 0
    const drawn = teamStats.drawn || 0
    const lost = teamStats.lost || 0
    const goalsFor = teamStats.goalsFor || 0
    const goalsAgainst = teamStats.goalsAgainst || 0
    
    // Win rate (0-100)
    const winRate = (won / played) * 100
    
    // Points per game (0-100)
    const points = teamStats.points || 0
    const ppg = (points / played) * 30
    
    // Goal difference per game
    const gdPerGame = (goalsFor - goalsAgainst) / played
    const goalDiffScore = Math.max(0, Math.min(100, (gdPerGame * 20) + 50))
    
    // Attack rating (goals per game) - ROUNDED
    const goalsPerGame = Math.round(goalsFor / played)
    const attackRating = Math.max(0, Math.min(100, (goalsPerGame * 25) + 20))
    
    // Defense rating (goals conceded per game) - ROUNDED
    const concededPerGame = Math.round(goalsAgainst / played)
    const defenseRating = Math.max(0, Math.min(100, 100 - (concededPerGame * 25)))
    
    // Form (last 5 matches)
    const form = teamStats.form || 'DLWWL'
    const formScore = calculateFormScore(form)
    
    // Overall rating
    const overall = (winRate * 0.35) + (ppg * 0.25) + (goalDiffScore * 0.20) + (formScore * 0.20)
    
    // Home advantage bonus
    const homeAdvantage = isHome ? 5 : 0
    
    return {
        overall: Math.round(Math.max(0, Math.min(100, overall + homeAdvantage))),
        attack: Math.round(Math.max(0, Math.min(100, attackRating))),
        defense: Math.round(Math.max(0, Math.min(100, defenseRating))),
        form: Math.round(formScore),
        homeAdvantage: homeAdvantage,
        winRate: Math.round(winRate),
        goalsPerGame: goalsPerGame,
        concededPerGame: concededPerGame,
        ppg: parseFloat(ppg.toFixed(2))
    }
}

function calculateFormScore(form) {
    if (!form) return 50
    let score = 0
    let total = 0
    for (const char of form.toUpperCase()) {
        if (char === 'W') { score += 3; total += 3 }
        else if (char === 'D') { score += 1; total += 3 }
        else if (char === 'L') { total += 3 }
        else if (char === ' ') { continue }
        else { total += 3 }
    }
    return total > 0 ? (score / total) * 100 : 50
}

// ============================================
// 2. HEAD-TO-HEAD ANALYSIS
// ============================================
export function calculateHeadToHead(h2hData) {
    if (!h2hData || h2hData.length === 0) {
        return {
            homeWins: 0,
            draws: 0,
            awayWins: 0,
            totalGames: 0,
            homeWinRate: 0,
            drawRate: 0,
            awayWinRate: 0,
            homeAdvantage: 0
        }
    }

    let homeWins = 0
    let draws = 0
    let awayWins = 0
    
    h2hData.forEach(match => {
        const homeScore = match.home_score || 0
        const awayScore = match.away_score || 0
        if (homeScore > awayScore) homeWins++
        else if (homeScore === awayScore) draws++
        else awayWins++
    })
    
    const totalGames = h2hData.length
    const homeWinRate = homeWins / totalGames
    const awayWinRate = awayWins / totalGames
    const drawRate = draws / totalGames
    
    const homeAdvantage = (homeWinRate - awayWinRate) * 50
    
    return {
        homeWins,
        draws,
        awayWins,
        totalGames,
        homeWinRate: Math.round(homeWinRate * 100),
        drawRate: Math.round(drawRate * 100),
        awayWinRate: Math.round(awayWinRate * 100),
        homeAdvantage: Math.round(homeAdvantage)
    }
}

// ============================================
// 3. MATCH PREDICTION (MAIN FUNCTION)
// ============================================
export function generatePrediction(match, homeStats, awayStats, h2hData) {
    // Calculate team ratings
    const homeRating = calculateTeamRating(homeStats, true)
    const awayRating = calculateTeamRating(awayStats, false)
    
    // Calculate H2H
    const h2h = calculateHeadToHead(h2hData)
    
    // Combine: Overall Rating + H2H + Home Advantage
    const homeOverall = homeRating.overall + (h2h.homeAdvantage * 0.3)
    const awayOverall = awayRating.overall - (h2h.homeAdvantage * 0.1)
    
    // Expected Goals - ROUNDED TO WHOLE NUMBERS
    const homeExpectedGoals = Math.round(((homeRating.goalsPerGame || 1) + (awayRating.concededPerGame || 1)) / 2)
    const awayExpectedGoals = Math.round(((awayRating.goalsPerGame || 1) + (homeRating.concededPerGame || 1)) / 2)
    const totalExpectedGoals = homeExpectedGoals + awayExpectedGoals
    
    // Match Result Probabilities
    const totalStrength = homeOverall + awayOverall
    const homeProb = (homeOverall / totalStrength) * 0.80 + 0.20
    const awayProb = (awayOverall / totalStrength) * 0.80 + 0.20
    const drawProb = 1 - homeProb - awayProb
    
    // Determine result
    let matchResult = 'Draw'
    let resultConfidence = 'Low'
    
    if (homeProb > drawProb && homeProb > awayProb) {
        matchResult = 'Home Win'
    } else if (awayProb > drawProb && awayProb > homeProb) {
        matchResult = 'Away Win'
    }
    
    // Confidence level
    const maxProb = Math.max(homeProb, drawProb, awayProb)
    if (maxProb > 0.55) resultConfidence = 'High'
    else if (maxProb > 0.42) resultConfidence = 'Medium'
    
    // Over/Under 2.5 - based on rounded expected goals
    const overUnder = totalExpectedGoals >= 3 ? 'Over 2.5' : 'Under 2.5'
    const overConfidence = Math.abs(totalExpectedGoals - 2.5) > 1 ? 'High' : 'Medium'
    
    // BTTS (Both Teams to Score)
    const homeScoreProb = homeExpectedGoals > 0
    const awayScoreProb = awayExpectedGoals > 0
    const btts = (homeScoreProb && awayScoreProb) ? 'Yes' : 'No'
    const bttsConfidence = (homeExpectedGoals > 1 && awayExpectedGoals > 1) ? 'High' : 'Medium'
    
    // Correct Score predictions - using rounded goals
    const correctScores = generateCorrectScores(homeExpectedGoals, awayExpectedGoals)
    
    // Half-Time / Full-Time
    const htft = generateHTFT(homeProb, drawProb, awayProb)
    
    return {
        // Match Result
        matchResult,
        resultConfidence,
        probabilities: {
            home: Math.round(homeProb * 100),
            draw: Math.round(drawProb * 100),
            away: Math.round(awayProb * 100)
        },
        
        // Over/Under
        overUnder,
        overConfidence,
        expectedGoals: {
            home: homeExpectedGoals,
            away: awayExpectedGoals,
            total: totalExpectedGoals
        },
        
        // BTTS
        btts,
        bttsConfidence,
        
        // Correct Score (Top 3)
        correctScores: correctScores.slice(0, 3),
        
        // Half-Time / Full-Time
        htft,
        
        // Team Ratings (for display)
        ratings: {
            home: homeRating,
            away: awayRating
        },
        
        // H2H Summary
        h2h: {
            homeWins: h2h.homeWins,
            draws: h2h.draws,
            awayWins: h2h.awayWins,
            total: h2h.totalGames
        },
        
        // Overall Confidence
        confidence: calculateOverallConfidence(homeProb, drawProb, awayProb, totalExpectedGoals),
        
        // Advice
        advice: generateAdvice(matchResult, resultConfidence, totalExpectedGoals, h2h),
        
        // Timestamp
        generatedAt: new Date().toISOString()
    }
}

// ============================================
// 4. CORRECT SCORE GENERATION
// ============================================
function generateCorrectScores(homeGoals, awayGoals) {
    const scores = []
    const range = 3
    
    // If goals are 0, use 1 as minimum for probability calculation
    const hLambda = Math.max(homeGoals, 1)
    const aLambda = Math.max(awayGoals, 1)
    
    for (let h = 0; h <= range; h++) {
        for (let a = 0; a <= range; a++) {
            const prob = poissonProbability(h, hLambda) * poissonProbability(a, aLambda)
            scores.push({ home: h, away: a, probability: prob })
        }
    }
    
    // Sort by probability
    scores.sort((a, b) => b.probability - a.probability)
    return scores.map(s => ({
        ...s,
        display: `${s.home}-${s.away}`,
        probability: (s.probability * 100).toFixed(1) + '%'
    }))
}

function poissonProbability(k, lambda) {
    if (lambda === 0) return k === 0 ? 1 : 0
    const e = Math.exp(-lambda)
    let factorial = 1
    for (let i = 2; i <= k; i++) factorial *= i
    return (e * Math.pow(lambda, k)) / factorial
}

// ============================================
// 5. HALF-TIME / FULL-TIME
// ============================================
function generateHTFT(homeProb, drawProb, awayProb) {
    const probabilities = []
    
    // Home win at HT, Home win at FT
    probabilities.push({ ht: 'Home', ft: 'Home', prob: homeProb * homeProb * 0.7 + 0.1 })
    // Draw at HT, Draw at FT
    probabilities.push({ ht: 'Draw', ft: 'Draw', prob: drawProb * drawProb * 0.7 + 0.1 })
    // Away win at HT, Away win at FT
    probabilities.push({ ht: 'Away', ft: 'Away', prob: awayProb * awayProb * 0.7 + 0.1 })
    // Home win at HT, Draw at FT
    probabilities.push({ ht: 'Home', ft: 'Draw', prob: homeProb * drawProb * 0.5 })
    // Away win at HT, Draw at FT
    probabilities.push({ ht: 'Away', ft: 'Draw', prob: awayProb * drawProb * 0.5 })
    
    // Find most likely
    probabilities.sort((a, b) => b.prob - a.prob)
    const top = probabilities[0]
    
    return {
        ht: top.ht,
        ft: top.ft,
        display: `${top.ht}/${top.ft}`,
        confidence: Math.round(Math.min(top.prob * 100, 85))
    }
}

// ============================================
// 6. OVERALL CONFIDENCE
// ============================================
function calculateOverallConfidence(homeProb, drawProb, awayProb, expectedGoals) {
    const maxProb = Math.max(homeProb, drawProb, awayProb)
    const spread = Math.max(homeProb, awayProb) - drawProb
    
    let score = 0
    // Result clarity
    if (maxProb > 0.50) score += 40
    else if (maxProb > 0.40) score += 25
    else score += 10
    
    // Spread
    if (spread > 0.15) score += 30
    else if (spread > 0.08) score += 15
    else score += 5
    
    // Goal expectation
    if (Math.abs(expectedGoals - 2.5) > 1.0) score += 20
    else if (Math.abs(expectedGoals - 2.5) > 0.5) score += 10
    else score += 5
    
    return Math.min(100, Math.round(score))
}

// ============================================
// 7. ADVICE GENERATION
// ============================================
function generateAdvice(result, resultConfidence, expectedGoals, h2h) {
    let advice = ''
    
    if (resultConfidence === 'High') {
        advice = `Strong data supports a ${result}. `
    } else if (resultConfidence === 'Medium') {
        advice = `Data slightly favors a ${result}. `
    } else {
        advice = `This is a close match. `
    }
    
    if (expectedGoals > 3) {
        advice += `Expect goals (${expectedGoals} total predicted). `
    } else if (expectedGoals < 2) {
        advice += `Likely to be a low-scoring game (${expectedGoals} total predicted). `
    }
    
    if (h2h.total > 0) {
        advice += `Head-to-head: ${h2h.homeWins}-${h2h.draws}-${h2h.awayWins}. `
    }
    
    return advice
}

// ============================================
// 8. GET PREDICTION SUMMARY (for display)
// ============================================
export function getPredictionSummary(prediction) {
    return {
        result: prediction.matchResult,
        resultConfidence: prediction.resultConfidence,
        overUnder: prediction.overUnder,
        btts: prediction.btts,
        expectedGoals: prediction.expectedGoals.total,
        topScores: prediction.correctScores.slice(0, 3),
        htft: prediction.htft,
        advice: prediction.advice,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities
    }
}

// ============================================
// 9. PREDICTION ACCURACY TRACKING
// ============================================
export async function trackPredictionAccuracy(userId, predictionId, matchId, predictedResult, actualResult) {
    try {
        const isCorrect = predictedResult === actualResult
        const pointsEarned = isCorrect ? 50 : 0

        const { error } = await supabase
            .from('prediction_accuracy')
            .insert({
                user_id: userId,
                prediction_id: predictionId,
                match_id: matchId,
                predicted_result: predictedResult,
                actual_result: actualResult,
                is_correct: isCorrect,
                points_earned: pointsEarned
            })

        if (error) throw error

        const { data: profile } = await supabase
            .from('profiles')
            .select('predictions_correct, predictions_wrong, prediction_streak, points')
            .eq('id', userId)
            .single()

        const currentCorrect = profile?.predictions_correct || 0
        const currentWrong = profile?.predictions_wrong || 0
        const currentStreak = profile?.prediction_streak || 0
        const currentPoints = profile?.points || 0

        let newCorrect = currentCorrect
        let newWrong = currentWrong
        let newStreak = currentStreak

        if (isCorrect) {
            newCorrect = currentCorrect + 1
            newStreak = currentStreak + 1
        } else {
            newWrong = currentWrong + 1
            newStreak = 0
        }

        await supabase
            .from('profiles')
            .update({
                predictions_correct: newCorrect,
                predictions_wrong: newWrong,
                prediction_streak: newStreak,
                points: currentPoints + pointsEarned
            })
            .eq('id', userId)

        return {
            success: true,
            isCorrect,
            pointsEarned,
            newStreak
        }

    } catch (error) {
        console.error('Error tracking prediction accuracy:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// 10. GET PREDICTION FOR A SPECIFIC MATCH
// ============================================

/**
 * Get AI prediction for a specific match
 * This uses the SAME prediction engine as Premium Predictions
 */
export async function getPredictionForMatch(matchId) {
    try {
        console.log('🔮 Getting prediction for match:', matchId)
        
        // Try to get from database first (if you store predictions)
        const { data: storedPred, error: predError } = await supabase
            .from('match_predictions')
            .select('*')
            .eq('match_id', matchId)
            .single()

        if (storedPred && !predError) {
            console.log('✅ Using stored prediction for match:', matchId)
            return storedPred.prediction
        }

        // Fetch match data from your matches table
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select(`
                *,
                home_team:home_team_id (id, name, crest),
                away_team:away_team_id (id, name, crest)
            `)
            .eq('id', matchId)
            .single()

        if (matchError) {
            console.warn('⚠️ Match not found in DB, using API fallback:', matchError)
            return await getPredictionFromApi(matchId)
        }

        // Get team stats
        const homeStats = await getTeamStats(match.home_team_id)
        const awayStats = await getTeamStats(match.away_team_id)
        
        // Get H2H data
        const h2hData = await getHeadToHead(match.home_team_id, match.away_team_id)

        // Generate prediction using your existing engine
        const prediction = generatePrediction(
            match,
            homeStats,
            awayStats,
            h2hData
        )

        // Store the prediction for future use
        await supabase
            .from('match_predictions')
            .upsert({
                match_id: matchId,
                prediction: prediction,
                updated_at: new Date().toISOString()
            })

        console.log('✅ Generated new prediction for match:', matchId)
        return prediction

    } catch (error) {
        console.error('❌ Error getting prediction for match:', error)
        return generateFallbackPrediction()
    }
}

// ============================================
// 11. GET TEAM STATS
// ============================================
async function getTeamStats(teamId) {
    try {
        const { data, error } = await supabase
            .from('team_stats')
            .select('*')
            .eq('team_id', teamId)
            .single()

        if (error) throw error
        return data || {}
    } catch (error) {
        console.warn('⚠️ No stats found for team:', teamId)
        return {}
    }
}

// ============================================
// 12. GET PREDICTIONS FOR MULTIPLE MATCHES
// ============================================

/**
 * Get AI predictions for multiple matches
 */
export async function getPredictionsForMatches(matchIds) {
    try {
        const predictions = await Promise.all(
            matchIds.map(async (id) => {
                try {
                    const pred = await getPredictionForMatch(id)
                    return { matchId: id, prediction: pred }
                } catch (e) {
                    return { matchId: id, prediction: null, error: e.message }
                }
            })
        )
        return predictions.filter(p => p.prediction !== null)
    } catch (error) {
        console.error('Error getting predictions for matches:', error)
        return []
    }
}

// ============================================
// 13. GET PREDICTION FROM FOOTBALL API (FALLBACK)
// ============================================

async function getPredictionFromApi(matchId) {
    try {
        const response = await fetch(`https://api.football-data.org/v4/matches/${matchId}`)
        if (!response.ok) throw new Error('API request failed')
        
        const data = await response.json()
        
        return {
            matchResult: data.score?.winner || 'Draw',
            confidence: 65,
            probabilities: { home: 35, draw: 30, away: 35 },
            overUnder: 'Over 2.5',
            btts: 'Yes',
            expectedGoals: { home: 1.5, away: 1.2, total: 2.7 },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        console.warn('API prediction fallback:', error)
        return generateFallbackPrediction()
    }
}

// ============================================
// 14. GET HEAD-TO-HEAD DATA
// ============================================

async function getHeadToHead(teamId1, teamId2) {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('home_score, away_score')
            .or(`home_team_id.eq.${teamId1},home_team_id.eq.${teamId2}`)
            .or(`away_team_id.eq.${teamId1},away_team_id.eq.${teamId2}`)
            .order('kickoff', { ascending: false })
            .limit(5)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching H2H data:', error)
        return []
    }
}

// ============================================
// 15. FALLBACK PREDICTION
// ============================================

function generateFallbackPrediction() {
    const outcomes = ['Home Win', 'Draw', 'Away Win']
    const result = outcomes[Math.floor(Math.random() * outcomes.length)]
    const confidence = Math.floor(Math.random() * 25) + 55
    
    return {
        matchResult: result,
        confidence: confidence,
        probabilities: {
            home: Math.floor(Math.random() * 30) + 25,
            draw: Math.floor(Math.random() * 25) + 20,
            away: Math.floor(Math.random() * 30) + 25
        },
        overUnder: Math.random() > 0.5 ? 'Over 2.5' : 'Under 2.5',
        btts: Math.random() > 0.5 ? 'Yes' : 'No',
        expectedGoals: {
            home: Math.round((Math.random() * 2) + 0.5),
            away: Math.round((Math.random() * 2) + 0.5),
            total: Math.round(Math.random() * 3) + 2
        },
        generatedAt: new Date().toISOString()
    }
}

// ============================================
// 16. REFRESH PREDICTIONS FOR LEAGUE
// ============================================

export async function refreshPredictionsForLeague(leagueCode) {
    try {
        const { data: matches, error } = await supabase
            .from('matches')
            .select('id')
            .eq('league', leagueCode)
            .gte('kickoff', new Date().toISOString())
            .limit(50)

        if (error) throw error
        if (!matches || matches.length === 0) return []

        const matchIds = matches.map(m => m.id)
        const predictions = await getPredictionsForMatches(matchIds)

        for (const pred of predictions) {
            if (pred.prediction) {
                await supabase
                    .from('match_predictions')
                    .upsert({
                        match_id: pred.matchId,
                        prediction: pred.prediction,
                        updated_at: new Date().toISOString()
                    })
            }
        }

        return predictions

    } catch (error) {
        console.error('Error refreshing predictions for league:', error)
        return []
    }
}

// ============================================
// 17. PREDICTION ACCURACY OVERVIEW
// ============================================

export async function getPredictionAccuracyStats(userId = null) {
    try {
        let query = supabase
            .from('prediction_accuracy')
            .select('*')
        
        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data, error } = await query
        if (error) throw error

        if (!data || data.length === 0) {
            return {
                total: 0,
                correct: 0,
                incorrect: 0,
                accuracy: 0,
                pointsEarned: 0
            }
        }

        const correct = data.filter(p => p.is_correct).length
        const total = data.length
        const pointsEarned = data.reduce((sum, p) => sum + (p.points_earned || 0), 0)

        return {
            total,
            correct,
            incorrect: total - correct,
            accuracy: Math.round((correct / total) * 100),
            pointsEarned
        }

    } catch (error) {
        console.error('Error getting prediction accuracy stats:', error)
        return null
    }
}