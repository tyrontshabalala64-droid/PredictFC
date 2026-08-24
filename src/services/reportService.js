import { supabase } from '../lib/supabase'

// Report types
export const REPORT_TYPES = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    INAPPROPRIATE: 'inappropriate',
    MISINFORMATION: 'misinformation',
    COPYRIGHT: 'copyright',
    OTHER: 'other'
}

export const REPORT_LABELS = {
    [REPORT_TYPES.SPAM]: 'Spam or misleading',
    [REPORT_TYPES.HARASSMENT]: 'Harassment or bullying',
    [REPORT_TYPES.HATE_SPEECH]: 'Hate speech',
    [REPORT_TYPES.INAPPROPRIATE]: 'Inappropriate content',
    [REPORT_TYPES.MISINFORMATION]: 'Misinformation',
    [REPORT_TYPES.COPYRIGHT]: 'Copyright violation',
    [REPORT_TYPES.OTHER]: 'Other'
}

export async function reportContent({
    reporterId,
    targetId,
    targetType, // 'post', 'comment', 'reply', 'user'
    reason,
    description,
    targetUserId
}) {
    try {
        const { data, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: reporterId,
                target_id: targetId,
                target_type: targetType,
                reason: reason,
                description: description || null,
                target_user_id: targetUserId || null,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error reporting content:', error)
        return { success: false, error: error.message }
    }
}

export async function getReports(status = 'pending') {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:reporter_id (id, username, full_name, avatar_url),
                target_user:target_user_id (id, username, full_name)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching reports:', error)
        return { success: false, error: error.message }
    }
}

export async function updateReportStatus(reportId, status, resolvedBy) {
    try {
        const { data, error } = await supabase
            .from('reports')
            .update({
                status: status,
                resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
                resolved_by: resolvedBy || null
            })
            .eq('id', reportId)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error updating report:', error)
        return { success: false, error: error.message }
    }
}