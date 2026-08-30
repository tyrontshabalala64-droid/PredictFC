// src/services/slipTrackingService.js
import { supabase } from '../lib/supabase'

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

        if (error) {
            // No slip found - return null
            return null
        }
        return data
    } catch (error) {
        console.error('Error getting slip by post ID:', error)
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
// GET ALL PENDING SLIPS (for background checking)
// ============================================
export const getPendingSlips = async (limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting pending slips:', error)
        return []
    }
}

// ============================================
// UPDATE SLIP STATUS
// ============================================
export const updateSlipStatus = async (slipId, status, actualReturn = 0) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .update({
                status: status,
                actual_return: actualReturn,
                settled_at: new Date().toISOString()
            })
            .eq('id', slipId)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating slip status:', error)
        return null
    }
}

// ============================================
// GET USER SLIP STATS
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

        const totalStake = data.reduce((sum, s) => sum + parseFloat(s.stake || 0), 0)
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
        return {
            total: 0,
            won: 0,
            lost: 0,
            pending: 0,
            partial: 0,
            winRate: 0,
            totalStake: 0,
            totalReturn: 0,
            profit: 0
        }
    }
}

// ============================================
// DELETE SLIP RECORD
// ============================================
export const deleteSlipRecord = async (slipId) => {
    try {
        const { error } = await supabase
            .from('slips')
            .delete()
            .eq('id', slipId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting slip record:', error)
        return false
    }
}

// ============================================
// GET SLIP BY USER AND POST
// ============================================
export const getSlipByUserAndPost = async (userId, postId) => {
    try {
        const { data, error } = await supabase
            .from('slips')
            .select('*')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .single()

        if (error) return null
        return data
    } catch (error) {
        return null
    }
}

export default {
    createSlipRecord,
    getSlipByPostId,
    getUserSlips,
    getPendingSlips,
    updateSlipStatus,
    getUserSlipStats,
    deleteSlipRecord,
    getSlipByUserAndPost
}