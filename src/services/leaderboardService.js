// src/services/leaderboardService.js
import { supabase } from '../lib/supabase'

/**
 * Get leaderboard data with user profiles
 * @param {string} timeFrame - 'today', 'week', 'month', 'all'
 * @param {number} limit - Number of users to return
 * @returns {Promise<Array>} Leaderboard data
 */
export async function getLeaderboard(timeFrame = 'today', limit = 10) {
    try {
        const now = new Date()
        let startDate = new Date()

        if (timeFrame === 'today') {
            startDate.setHours(0, 0, 0, 0)
        } else if (timeFrame === 'week') {
            startDate.setDate(now.getDate() - 7)
        } else if (timeFrame === 'month') {
            startDate.setMonth(now.getMonth() - 1)
        } else if (timeFrame === 'all') {
            startDate = new Date(0)
        }

        const startDateStr = startDate.toISOString()

        const { data: predictions, error } = await supabase
            .from('public_predictions')
            .select(`
                id,
                user_id,
                likes_count,
                created_at,
                prediction_data,
                profiles:user_id (
                    id,
                    username,
                    full_name,
                    avatar_url,
                    points,
                    is_verified,
                    predictions_correct,
                    predictions_wrong,
                    prediction_streak
                )
            `)
            .gte('created_at', startDateStr)
            .order('likes_count', { ascending: false })
            .limit(limit)

        if (error) {
            console.warn('Error fetching leaderboard:', error)
            return []
        }

        if (!predictions || predictions.length === 0) {
            return []
        }

        return predictions.map(p => ({
            ...p,
            user: p.profiles,
            totalLikes: p.likes_count || 0,
            accuracy: calculateAccuracy(p.profiles?.predictions_correct, p.profiles?.predictions_wrong)
        }))

    } catch (error) {
        console.error('Error getting leaderboard:', error)
        return []
    }
}

/**
 * Get user's position on leaderboard
 */
export async function getUserLeaderboardPosition(userId, timeFrame = 'today') {
    try {
        const allUsers = await getLeaderboard(timeFrame, 1000)
        const position = allUsers.findIndex(u => u.user_id === userId)
        
        if (position === -1) {
            return { position: null, totalUsers: allUsers.length }
        }

        const userData = allUsers[position]
        
        return {
            position: position + 1,
            totalUsers: allUsers.length,
            likes: userData.totalLikes,
            username: userData.user?.username,
            fullName: userData.user?.full_name
        }
    } catch (error) {
        console.error('Error getting user position:', error)
        return { position: null, totalUsers: 0 }
    }
}

/**
 * Get user's prediction stats
 */
export async function getUserPredictionStats(userId) {
    try {
        const { count: totalPredictions, error: countError } = await supabase
            .from('public_predictions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        if (countError) {
            console.warn('Error counting predictions:', countError)
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('predictions_correct, predictions_wrong, prediction_streak, points')
            .eq('id', userId)
            .single()

        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Error fetching profile stats:', profileError)
        }

        const correct = profile?.predictions_correct || 0
        const wrong = profile?.predictions_wrong || 0
        const total = correct + wrong

        return {
            totalPredictions: totalPredictions || 0,
            correct: correct,
            wrong: wrong,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
            streak: profile?.prediction_streak || 0,
            points: profile?.points || 0
        }

    } catch (error) {
        console.error('Error getting user prediction stats:', error)
        return {
            totalPredictions: 0,
            correct: 0,
            wrong: 0,
            accuracy: 0,
            streak: 0,
            points: 0
        }
    }
}

/**
 * Track prediction accuracy
 */
export async function trackPredictionAccuracy(userId, predictionId, matchId, predictedResult, actualResult) {
    try {
        const isCorrect = predictedResult === actualResult
        const pointsEarned = isCorrect ? 50 : 0

        const { data, error } = await supabase
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
            .select()

        if (error) {
            console.warn('Error inserting prediction accuracy:', error)
            return { success: false, error: error.message }
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('predictions_correct, predictions_wrong, prediction_streak, points')
            .eq('id', userId)
            .single()

        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Error fetching profile:', profileError)
        }

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

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                predictions_correct: newCorrect,
                predictions_wrong: newWrong,
                prediction_streak: newStreak,
                points: currentPoints + pointsEarned
            })
            .eq('id', userId)

        if (updateError) {
            console.warn('Error updating profile:', updateError)
        }

        return {
            success: true,
            isCorrect,
            pointsEarned,
            newStreak,
            newAccuracy: newCorrect + newWrong > 0 ? Math.round((newCorrect / (newCorrect + newWrong)) * 100) : 0
        }

    } catch (error) {
        console.error('Error tracking prediction accuracy:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Get top predictors by accuracy
 */
export async function getTopPredictorsByAccuracy(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, predictions_correct, predictions_wrong, is_verified')
            .gt('predictions_correct', 0)
            .order('predictions_correct', { ascending: false })
            .limit(limit)

        if (error) {
            console.warn('Error getting top predictors:', error)
            return []
        }

        return data.map(user => {
            const total = (user.predictions_correct || 0) + (user.predictions_wrong || 0)
            return {
                ...user,
                accuracy: total > 0 ? Math.round((user.predictions_correct / total) * 100) : 0,
                totalPredictions: total
            }
        })

    } catch (error) {
        console.error('Error getting top predictors:', error)
        return []
    }
}

/**
 * Get prediction history for a user
 */
export async function getUserPredictionHistory(userId, limit = 20) {
    try {
        const { data, error } = await supabase
            .from('prediction_accuracy')
            .select(`
                *,
                public_predictions:prediction_id (
                    prediction_data,
                    match_id,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.warn('Error getting prediction history:', error)
            return []
        }

        return data || []

    } catch (error) {
        console.error('Error getting prediction history:', error)
        return []
    }
}

/**
 * Get leaderboard by points
 */
export async function getLeaderboardByPoints(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, points, is_verified')
            .order('points', { ascending: false })
            .limit(limit)

        if (error) {
            console.warn('Error getting points leaderboard:', error)
            return []
        }
        return data || []

    } catch (error) {
        console.error('Error getting points leaderboard:', error)
        return []
    }
}

/**
 * Get leaderboard by prediction streak
 */
export async function getLeaderboardByStreak(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, prediction_streak, is_verified')
            .gt('prediction_streak', 0)
            .order('prediction_streak', { ascending: false })
            .limit(limit)

        if (error) {
            console.warn('Error getting streak leaderboard:', error)
            return []
        }
        return data || []

    } catch (error) {
        console.error('Error getting streak leaderboard:', error)
        return []
    }
}

/**
 * Calculate accuracy from correct/wrong counts
 */
function calculateAccuracy(correct, wrong) {
    const total = (correct || 0) + (wrong || 0)
    return total > 0 ? Math.round((correct / total) * 100) : 0
}

/**
 * Get match result from score
 */
export function getMatchResult(homeScore, awayScore) {
    if (homeScore > awayScore) return 'Home Win'
    if (homeScore < awayScore) return 'Away Win'
    return 'Draw'
}

/**
 * Check if prediction was correct
 */
export function isPredictionCorrect(prediction, actual) {
    if (!prediction || !actual) return false
    
    const predictedResult = prediction.prediction_data?.result || prediction.match_result
    const actualResult = getMatchResult(actual.homeScore, actual.awayScore)
    
    return predictedResult === actualResult
}

/**
 * Award points for correct prediction
 */
export async function awardPredictionPoints(userId, points = 50) {
    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single()

        if (profileError) {
            console.warn('Error fetching profile for points:', profileError)
            return { success: false, error: profileError.message }
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: (profile?.points || 0) + points })
            .eq('id', userId)

        if (updateError) {
            console.warn('Error updating points:', updateError)
            return { success: false, error: updateError.message }
        }

        return { success: true, newPoints: (profile?.points || 0) + points }

    } catch (error) {
        console.error('Error awarding points:', error)
        return { success: false, error: error.message }
    }
}