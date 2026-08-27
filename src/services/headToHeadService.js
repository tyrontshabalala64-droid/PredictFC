// src/services/headToHeadService.js
import { supabase } from '../lib/supabase'

/**
 * Fetch head-to-head data between two teams
 */
export async function getHeadToHead(homeTeamId, awayTeamId) {
    if (!homeTeamId || !awayTeamId) {
        return []
    }

    try {
        const { data, error } = await supabase
            .from('head_to_head')
            .select('*')
            .or(`home_team_id.eq.${homeTeamId},away_team_id.eq.${homeTeamId}`)
            .or(`home_team_id.eq.${awayTeamId},away_team_id.eq.${awayTeamId}`)
            .order('match_date', { ascending: false })
            .limit(10)

        if (error) {
            console.warn('Error fetching H2H:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.warn('Could not fetch H2H:', error)
        return []
    }
}

/**
 * Save head-to-head data (for admin use)
 */
export async function saveHeadToHead(h2hData) {
    try {
        const { data, error } = await supabase
            .from('head_to_head')
            .insert(h2hData)
            .select()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error saving H2H:', error)
        return null
    }
}

/**
 * Get team stats from database or create if not exists
 */
export async function getTeamStats(teamId, competition) {
    try {
        const { data, error } = await supabase
            .from('team_stats')
            .select('*')
            .eq('team_id', teamId)
            .eq('competition', competition)
            .maybeSingle()

        if (error) {
            console.warn('Error fetching team stats:', error)
            return null
        }

        return data
    } catch (error) {
        console.warn('Could not fetch team stats:', error)
        return null
    }
}

/**
 * Update team stats after match
 */
export async function updateTeamStatsAfterMatch(matchData) {
    try {
        // Call the stored procedure
        const { error } = await supabase.rpc('update_team_stats', {
            p_team_id: matchData.teamId,
            p_competition: matchData.competition,
            p_goals_for: matchData.goalsFor,
            p_goals_against: matchData.goalsAgainst,
            p_result: matchData.result // 'W', 'D', or 'L'
        })

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error updating team stats:', error)
        return false
    }
}