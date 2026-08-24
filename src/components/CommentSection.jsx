 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VerifiedBadge from './VerifiedBadge'
import { User, Reply, Send } from 'lucide-react'

export default function CommentSection({ 
    postId, 
    comments: initialComments, 
    onRefresh, 
    currentUser, 
    isCommunity = false,
    postAuthorId,
    totalCount = 0
}) {
    const [newComment, setNewComment] = useState('')
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [comments, setComments] = useState(initialComments || [])
    const [loading, setLoading] = useState(false)
    const [localCount, setLocalCount] = useState(totalCount)

    const commentsTable = isCommunity ? 'community_post_comments' : 'post_comments'

    useEffect(() => {
        const fetchComments = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from(commentsTable)
                    .select(`
                        *,
                        profiles:user_id (id, username, full_name, avatar_url, is_verified)
                    `)
                    .eq('post_id', postId)
                    .order('created_at', { ascending: true })

                if (error) throw error
                setComments(data || [])
            } catch (error) {
                console.error('Error loading comments:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchComments()
    }, [postId, commentsTable])

    const handleComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim() || !currentUser) return

        setSubmitting(true)
        try {
            const { data, error } = await supabase
                .from(commentsTable)
                .insert({
                    post_id: postId,
                    user_id: currentUser.id,
                    text: newComment.trim()
                })
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified)
                `)
                .single()

            if (error) throw error

            // Update comment count
            if (isCommunity) {
                await supabase
                    .from('community_posts')
                    .update({ comments_count: (localCount || 0) + 1 })
                    .eq('id', postId)
            } else {
                await supabase
                    .from('posts')
                    .update({ comments_count: (localCount || 0) + 1 })
                    .eq('id', postId)
            }

            // ✅ Create a comment notification (only if not commenting on your own post)
            if (postAuthorId && postAuthorId !== currentUser.id) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: postAuthorId,
                        from_user_id: currentUser.id,
                        type: 'comment',
                        message: `${currentUser?.full_name || currentUser?.username || 'Someone'} commented on your post`,
                        post_id: postId
                    })
            }

            setComments(prev => [...prev, data])
            setLocalCount(prev => prev + 1)
            setNewComment('')
            
            if (onRefresh) {
                onRefresh()
            }
        } catch (error) {
            console.error('Error commenting:', error)
            alert('Failed to add comment')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReply = async (commentId) => {
        if (!replyText.trim() || !currentUser) return

        setSubmitting(true)
        try {
            const tableName = isCommunity ? 'community_post_comments' : 'post_comments'
            
            const { data, error } = await supabase
                .from('comment_replies')
                .insert({
                    comment_id: !isCommunity ? commentId : null,
                    community_comment_id: isCommunity ? commentId : null,
                    user_id: currentUser.id,
                    text: replyText.trim()
                })
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified)
                `)
                .single()

            if (error) throw error

            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), data]
                    }
                }
                return comment
            }))

            setReplyText('')
            setReplyingTo(null)
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error('Error replying:', error)
            alert('Failed to add reply')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="py-2 text-center text-sm text-gray-400">
                Loading comments...
            </div>
        )
    }

    return (
        <div>
            {/* The actual list of comments */}
            {comments?.map((comment) => (
                <div key={comment.id} className="mb-3">
                    <div className="flex gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
                            <User size={14} />
                        </div>
                        <div className="flex-1">
                            <div className="bg-gray-100 rounded-lg px-3 py-2">
                                <div className="font-semibold flex items-center gap-1.5 text-sm">
                                    {comment.profiles?.full_name || comment.profiles?.username || 'Unknown'}
                                    {comment.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                </div>
                                <p className="text-sm text-gray-800">{comment.text}</p>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <button 
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="hover:text-green-600 transition flex items-center gap-1"
                                >
                                    <Reply size={12} /> Reply
                                </button>
                                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>

                            {comment.replies?.map((reply) => (
                                <div key={reply.id} className="flex gap-2 mt-2 ml-8">
                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-[10px] font-bold">
                                        <User size={12} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-50 rounded-lg px-3 py-1.5">
                                            <div className="font-semibold flex items-center gap-1.5 text-xs">
                                                {reply.profiles?.full_name || reply.profiles?.username || 'Unknown'}
                                                {reply.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                            </div>
                                            <p className="text-sm text-gray-700">{reply.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {replyingTo === comment.id && (
                                <div className="flex gap-2 mt-2 ml-8">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <button
                                        onClick={() => handleReply(comment.id)}
                                        disabled={submitting || !replyText.trim()}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        <Send size={14} /> Reply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <form onSubmit={handleComment} className="flex gap-2 mt-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                    <Send size={16} /> Post
                </button>
            </form>
        </div>
    )
}