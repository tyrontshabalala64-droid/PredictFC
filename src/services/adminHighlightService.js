 // src/services/adminHighlightService.js
import { supabase } from '../lib/supabase'

// ============================================
// LEAGUE INFO
// ============================================
export const LEAGUE_INFO = {
    PL: { name: 'Premier League', icon: '🏴', code: 'PL' },
    PD: { name: 'La Liga', icon: '🇪🇸', code: 'PD' },
    BL1: { name: 'Bundesliga', icon: '🇩🇪', code: 'BL1' },
    SA: { name: 'Serie A', icon: '🇮🇹', code: 'SA' },
    FL1: { name: 'Ligue 1', icon: '🇫🇷', code: 'FL1' },
    CL: { name: 'Champions League', icon: '🌟', code: 'CL' },
    PSL: { name: 'PSL', icon: '🇿🇦', code: 'PSL' },
}

// ============================================
// CONTENT TYPES
// ============================================
export const CONTENT_TYPES = [
    { value: 'fixture', label: 'Fixtures', icon: '📅' },
    { value: 'prediction', label: 'Premium Prediction', icon: '🤖' },
    { value: 'custom', label: 'Custom Post', icon: '📣' },
]

// ============================================
// GET ADMIN HIGHLIGHTS
// ============================================
export async function getAdminHighlights(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('admin_highlights')
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching admin highlights:', error)
        return []
    }
}

// ============================================
// GET ALL ADMIN HIGHLIGHTS (for admin panel)
// ============================================
export async function getAllAdminHighlights() {
    try {
        const { data, error } = await supabase
            .from('admin_highlights')
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching all admin highlights:', error)
        return []
    }
}

// ============================================
// CREATE ADMIN HIGHLIGHT
// ============================================
export async function createAdminHighlight(data) {
    try {
        // Validate required fields
        if (!data.title || !data.content_type || !data.content) {
            throw new Error('Title, content type, and content are required')
        }

        // Build the insert object
        const insertData = {
            title: data.title.trim(),
            content_type: data.content_type,
            league: data.league || null,
            content: data.content.trim(),
            image_url: data.image_url || null,
            link_url: data.link_url || null,
            priority: parseInt(data.priority) || 0,
            is_active: data.is_active !== undefined ? data.is_active : true,
            starts_at: data.starts_at || new Date().toISOString(),
            expires_at: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_by: data.created_by,
            // NEW FIELDS - Match and Prediction data
            match_id: data.match_id || null,
            match_data: data.match_data || null,
            prediction_data: data.prediction_data || null
        }

        const { data: result, error } = await supabase
            .from('admin_highlights')
            .insert(insertData)
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            throw new Error(error.message || 'Failed to create highlight')
        }

        return result
    } catch (error) {
        console.error('Error creating admin highlight:', error)
        throw error
    }
}

// ============================================
// UPDATE ADMIN HIGHLIGHT
// ============================================
export async function updateAdminHighlight(id, data) {
    try {
        if (!id) throw new Error('Highlight ID is required')

        // Build the update object
        const updateData = {
            title: data.title.trim(),
            content_type: data.content_type,
            league: data.league || null,
            content: data.content.trim(),
            image_url: data.image_url || null,
            link_url: data.link_url || null,
            priority: parseInt(data.priority) || 0,
            expires_at: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            // NEW FIELDS - Match and Prediction data
            match_id: data.match_id || null,
            match_data: data.match_data || null,
            prediction_data: data.prediction_data || null
        }

        const { data: result, error } = await supabase
            .from('admin_highlights')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .single()

        if (error) {
            console.error('Supabase update error:', error)
            throw new Error(error.message || 'Failed to update highlight')
        }

        return result
    } catch (error) {
        console.error('Error updating admin highlight:', error)
        throw error
    }
}

// ============================================
// DELETE ADMIN HIGHLIGHT (soft delete)
// ============================================
export async function deleteAdminHighlight(id) {
    try {
        if (!id) throw new Error('Highlight ID is required')

        const { error } = await supabase
            .from('admin_highlights')
            .update({ 
                is_active: false,
                deleted_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error('Supabase delete error:', error)
            throw new Error(error.message || 'Failed to delete highlight')
        }

        return true
    } catch (error) {
        console.error('Error deleting admin highlight:', error)
        throw error
    }
}

// ============================================
// PERMANENTLY DELETE ADMIN HIGHLIGHT
// ============================================
export async function permanentlyDeleteAdminHighlight(id) {
    try {
        if (!id) throw new Error('Highlight ID is required')

        const { error } = await supabase
            .from('admin_highlights')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Supabase permanent delete error:', error)
            throw new Error(error.message || 'Failed to permanently delete highlight')
        }

        return true
    } catch (error) {
        console.error('Error permanently deleting admin highlight:', error)
        throw error
    }
}

// ============================================
// TOGGLE ADMIN HIGHLIGHT ACTIVE STATUS
// ============================================
export async function toggleAdminHighlightStatus(id, isActive) {
    try {
        if (!id) throw new Error('Highlight ID is required')

        const { data: result, error } = await supabase
            .from('admin_highlights')
            .update({ 
                is_active: isActive !== undefined ? isActive : false
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase toggle error:', error)
            throw new Error(error.message || 'Failed to toggle highlight status')
        }

        return result
    } catch (error) {
        console.error('Error toggling admin highlight status:', error)
        throw error
    }
}

// ============================================
// GET HIGHLIGHTS BY TYPE
// ============================================
export async function getHighlightsByType(contentType, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('admin_highlights')
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .eq('is_active', true)
            .eq('content_type', contentType)
            .gte('expires_at', new Date().toISOString())
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error(`Error fetching ${contentType} highlights:`, error)
        return []
    }
}

// ============================================
// GET HIGHLIGHTS BY LEAGUE
// ============================================
export async function getHighlightsByLeague(leagueCode, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('admin_highlights')
            .select(`
                *,
                profiles:created_by (id, username, full_name, avatar_url)
            `)
            .eq('is_active', true)
            .eq('league', leagueCode)
            .gte('expires_at', new Date().toISOString())
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error(`Error fetching highlights for league ${leagueCode}:`, error)
        return []
    }
}

// ============================================
// GET ACTIVE HIGHLIGHTS COUNT
// ============================================
export async function getActiveHighlightsCount() {
    try {
        const { count, error } = await supabase
            .from('admin_highlights')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())

        if (error) throw error
        return count || 0
    } catch (error) {
        console.error('Error counting active highlights:', error)
        return 0
    }
}

// ============================================
// EXTEND HIGHLIGHT EXPIRATION
// ============================================
export async function extendHighlightExpiration(id, hours = 24) {
    try {
        if (!id) throw new Error('Highlight ID is required')

        const { data: current } = await supabase
            .from('admin_highlights')
            .select('expires_at')
            .eq('id', id)
            .single()

        const currentExpiry = current?.expires_at ? new Date(current.expires_at) : new Date()
        const newExpiry = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000)

        const { data: result, error } = await supabase
            .from('admin_highlights')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return result
    } catch (error) {
        console.error('Error extending highlight expiration:', error)
        throw error
    }
}

// ============================================
// HELPER: FORMAT HIGHLIGHT FOR DISPLAY
// ============================================
export function formatHighlightForDisplay(highlight) {
    if (!highlight) return null

    return {
        ...highlight,
        // Format the display based on content type
        displayTitle: highlight.title || 'Untitled',
        displayContent: highlight.content || '',
        displayType: CONTENT_TYPES.find(t => t.value === highlight.content_type)?.label || highlight.content_type,
        displayLeague: highlight.league ? LEAGUE_INFO[highlight.league]?.name || highlight.league : null,
        displayIcon: highlight.content_type === 'fixture' ? '📅' :
                      highlight.content_type === 'prediction' ? '🤖' : '📣',
        // Check if highlight is still valid
        isValid: highlight.is_active && 
                 (!highlight.expires_at || new Date(highlight.expires_at) > new Date()),
        // Time remaining until expiration
        timeRemaining: highlight.expires_at ? 
            Math.max(0, Math.floor((new Date(highlight.expires_at) - new Date()) / (1000 * 60 * 60))) : 
            null,
        // Get match data if available
        hasMatchData: !!highlight.match_data,
        hasPredictionData: !!highlight.prediction_data,
        // Format match data
        matchInfo: highlight.match_data ? {
            homeTeam: highlight.match_data.homeTeam?.name || 'TBD',
            awayTeam: highlight.match_data.awayTeam?.name || 'TBD',
            homeCrest: highlight.match_data.homeTeam?.crest || null,
            awayCrest: highlight.match_data.awayTeam?.crest || null,
            kickoff: highlight.match_data.kickoff || null,
            status: highlight.match_data.status || 'scheduled',
            league: highlight.match_data.competition?.name || highlight.league
        } : null,
        // Format prediction data
        predictionInfo: highlight.prediction_data ? {
            homeTeam: highlight.prediction_data.match?.homeTeam?.name || 'TBD',
            awayTeam: highlight.prediction_data.match?.awayTeam?.name || 'TBD',
            result: highlight.prediction_data.prediction?.result || 'TBD',
            confidence: highlight.prediction_data.prediction?.confidence || 0,
            cards: highlight.prediction_data.prediction?.cards || 0,
            corners: highlight.prediction_data.prediction?.corners || 0
        } : null
    }
}

// ============================================
// HELPER: BATCH FORMAT HIGHLIGHTS
// ============================================
export function formatHighlightsForDisplay(highlights) {
    if (!highlights || !Array.isArray(highlights)) return []
    return highlights.map(h => formatHighlightForDisplay(h))
}