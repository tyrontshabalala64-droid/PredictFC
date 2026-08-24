 import { supabase } from '../lib/supabase'

export async function checkUserSubscription(userId) {
    if (!userId) return false

    try {
        // 1. If user is an admin, they get access for free
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (profileError) throw profileError
        if (profile?.role === 'admin') return true

        // 2. Check for valid premium subscription
        const { data, error } = await supabase
            .from('subscription_payments')
            .select('id, expires_at, created_at')
            .eq('user_id', userId)
            .eq('type', 'premium')
            .eq('status', 'success')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error
        if (!data) return false

        // If they have an expiration date, check if it's still valid
        if (data.expires_at) {
            return new Date(data.expires_at) > new Date()
        }

        // If no expiry date, check if created within the last 30 days
        const created = new Date(data.created_at)
        const expiry = new Date(created)
        expiry.setDate(expiry.getDate() + 30)
        return expiry > new Date()
    } catch (error) {
        console.error('Error checking subscription:', error)
        return false
    }
}