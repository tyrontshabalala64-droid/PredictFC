import { supabase } from '../lib/supabase'

export async function createNotification({
  userId,
  fromUserId,
  type,
  message,
  postId = null,
  communityId = null
}) {
  try {
    // Don't notify if you're doing it to yourself
    if (userId === fromUserId) return

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        from_user_id: fromUserId,
        type,
        message,
        post_id: postId,
        community_id: communityId,
        read: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function getUnreadCount(userId) {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    return count || 0
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

export async function markAllAsRead(userId) {
  try {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}