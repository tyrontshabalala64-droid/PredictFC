import { supabase } from './supabase'

export async function logAdminAction(action, targetType, targetId, details = null) {
    try {
        const { data, error } = await supabase
            .rpc('log_admin_action', {
                action_text: action,
                target_type: targetType,
                target_id: targetId,
                details: details
            })
        
        if (error) {
            console.error('Audit log error:', error)
        }
        return data
    } catch (error) {
        console.error('Audit log error:', error)
        return null
    }
}