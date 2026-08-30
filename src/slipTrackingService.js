// src/services/slipTrackingService.js
import { supabase } from '../lib/supabase'
import { getTodaysMatches, formatMatch } from './footballApi'

// ============================================
// CREATE SLIP RECORD
// ============================================
export const createSlipRecord = async (postId, userId, slipData) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .insert({
                post_id: postId,
                user_id: userId,
                matches: slipData.matches,
                stake: slipData.stake,
                total_odds: slipData.totalOdds,
                potential_return: slipData.potentialReturn,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating slip record:', error)
        return null
    }
}

// ============================================
// GET SLIP BY POST ID
// ============================================
export const getSlipByPostId = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .select('*')
            .eq('post_id', postId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        return null
    }
}

// ============================================
// GET USER SLIPS
// ============================================
export const getUserSlips = async (userId, limit = 20) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .select(`
                *,
                posts:post_id (text, created_at)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting user slips:', error)
        return []
    }
}

// ============================================
// CHECK SLIP RESULT
// ============================================
export const checkSlipResult = async (slip) => {
    if (!slip || slip.status !== 'pending') return slip

    try {
        // Fetch actual match results for each match in the slip
        let allWon = true
        let anyWon = false
        const updatedMatches = []

        for (const match of slip.matches) {
            const matchResult = await getMatchResult(match.matchId)
            
            if (matchResult) {
                // Check each market in the match
                let matchWon = true
                const updatedMarkets = match.markets.map(market => {
                    const isCorrect = checkMarketResult(market, matchResult)
                    if (!isCorrect) matchWon = false
                    return {
                        ...market,
                        result: isCorrect ? 'won' : 'lost'
                    }
                })

                if (matchWon) anyWon = true
                if (!matchWon) allWon = false

                updatedMatches.push({
                    ...match,
                    markets: updatedMarkets,
                    matchResult: matchWon ? 'won' : 'lost',
                    actualScore: `${matchResult.homeScore} - ${matchResult.awayScore}`
                })
            } else {
                // Match not finished yet
                return { ...slip, status: 'pending' }
            }
        }

        // Determine overall status
        let status = 'lost'
        let actualReturn = 0

        if (allWon) {
            status = 'won'
            actualReturn = slip.potential_return
        } else if (anyWon) {
            status = 'partial'
            // Calculate partial return for winning bets only
            actualReturn = calculatePartialReturn(slip.matches, updatedMatches)
        }

        // Update slip in database
        const { data, error } = await supabase
            .from('slips')
            .update({
                status: status,
                actual_return: actualReturn,
                settled_at: new Date().toISOString(),
                matches: updatedMatches
            })
            .eq('id', slip.id)
            .select()
            .single()

        if (error) throw error
        return data

    } catch (error) {
        console.error('Error checking slip result:', error)
        return slip
    }
}

// ============================================
// GET MATCH RESULT
// ============================================
const getMatchResult = async (matchId) => {
    try {
        // Try to get from your football API
        const { matches } = await getTodaysMatches()
        const match = matches.find(m => m.id === matchId)
        
        if (!match) return null

        // Check if match is finished
        if (match.status !== 'FINISHED') return null

        return {
            homeScore: match.score?.fullTime?.home || 0,
            awayScore: match.score?.fullTime?.away || 0,
            winner: match.score?.winner || 'DRAW',
            homeTeam: match.homeTeam?.name || 'Home',
            awayTeam: match.awayTeam?.name || 'Away',
            status: match.status
        }
    } catch (error) {
        console.error('Error fetching match result:', error)
        return null
    }
}

// ============================================
// CHECK MARKET RESULT
// ============================================
const checkMarketResult = (market, matchResult) => {
    switch (market.type) {
        case 'Match Result':
            return checkMatchResult(market.pick, matchResult)
        case 'Over/Under 2.5 Goals':
            return checkOverUnder(market.pick, matchResult)
        case 'Both Teams to Score':
            return checkBTTS(market.pick, matchResult)
        case 'Total Corners':
            return checkCorners(market.pick, matchResult)
        case 'Total Goals (1.5)':
            return checkOverUnder15(market.pick, matchResult)
        default:
            return false
    }
}

// ============================================
// INDIVIDUAL MARKET CHECKS
// ============================================
const checkMatchResult = (prediction, matchResult) => {
    const totalGoals = matchResult.homeScore + matchResult.awayScore
    if (prediction === 'Draw') {
        return matchResult.homeScore === matchResult.awayScore
    } else if (prediction === 'Home Win') {
        return matchResult.homeScore > matchResult.awayScore
    } else if (prediction === 'Away Win') {
        return matchResult.awayScore > matchResult.homeScore
    }
    return false
}

const checkOverUnder = (prediction, matchResult) => {
    const totalGoals = matchResult.homeScore + matchResult.awayScore
    if (prediction === 'Over 2.5') {
        return totalGoals > 2.5
    } else if (prediction === 'Under 2.5') {
        return totalGoals < 2.5
    }
    return false
}

const checkBTTS = (prediction, matchResult) => {
    const bothScored = matchResult.homeScore > 0 && matchResult.awayScore > 0
    if (prediction === 'Yes') {
        return bothScored
    } else if (prediction === 'No') {
        return !bothScored
    }
    return false
}

const checkCorners = (prediction, matchResult) => {
    // This requires corners data from API
    const totalCorners = matchResult.corners || 0
    if (prediction === 'Over 9.5') {
        return totalCorners > 9.5
    } else if (prediction === 'Under 9.5') {
        return totalCorners < 9.5
    }
    return false
}

const checkOverUnder15 = (prediction, matchResult) => {
    const totalGoals = matchResult.homeScore + matchResult.awayScore
    if (prediction === 'Over 1.5') {
        return totalGoals > 1.5
    } else if (prediction === 'Under 1.5') {
        return totalGoals < 1.5
    }
    return false
}

// ============================================
// CALCULATE PARTIAL RETURN
// ============================================
const calculatePartialReturn = (originalMatches, updatedMatches) => {
    let totalReturn = 0
    let totalStake = 0

    updatedMatches.forEach((match, index) => {
        if (match.matchResult === 'won') {
            const originalMatch = originalMatches[index]
            // Calculate proportional return for winning matches
            const matchOdds = originalMatch.totalOdds || 1
            totalReturn += matchOdds
        }
        totalStake += 1
    })

    return totalReturn
}

// ============================================
// SLIP STATS
// ============================================
export const getUserSlipStats = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .select('*')
            .eq('user_id', userId)

        if (error) throw error

        const total = data.length
        const won = data.filter(s => s.status === 'won').length
        const lost = data.filter(s => s.status === 'lost').length
        const pending = data.filter(s => s.status === 'pending').length
        const partial = data.filter(s => s.status === 'partial').length

        const totalStake = data.reduce((sum, s) => sum + parseFloat(s.stake), 0)
        const totalReturn = data.reduce((sum, s) => sum + parseFloat(s.actual_return || 0), 0)
        const profit = totalReturn - totalStake

        return {
            total,
            won,
            lost,
            pending,
            partial,
            winRate: total > 0 ? Math.round((won / total) * 100) : 0,
            totalStake,
            totalReturn,
            profit
        }
    } catch (error) {
        console.error('Error getting slip stats:', error)
        return null
    }
}