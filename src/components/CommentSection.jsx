 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VerifiedBadge from './VerifiedBadge'
import { User, Reply, Send, Loader, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'

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
    const [showAllComments, setShowAllComments] = useState(false)
    const [loadingReplies, setLoadingReplies] = useState({})

    const commentsTable = isCommunity ? 'community_post_comments' : 'post_comments'

    useEffect(() => {
        if (showAllComments) {
            fetchComments()
        } else if (initialComments && initialComments.length > 0) {
            // Check if initial comments have replies already
            const hasReplies = initialComments.some(c => c.replies && c.replies.length > 0)
            if (hasReplies) {
                setComments(initialComments)
            } else {
                // Load replies for initial comments if not present
                loadRepliesForInitialComments(initialComments)
            }
        }
    }, [postId, showAllComments, initialComments])

    // Load replies for initial comments
    const loadRepliesForInitialComments = async (commentsList) => {
        const commentsWithReplies = await Promise.all(
            commentsList.map(async (comment) => {
                const { data: replies, error } = await supabase
                    .from('comment_replies')
                    .select('*')
                    .eq('comment_id', comment.id)
                    .order('created_at', { ascending: true })
                    .limit(10)
                
                if (error || !replies || replies.length === 0) {
                    return { ...comment, replies: [], showReplies: false }
                }
                
                // Fetch profiles for each reply
                const repliesWithProfiles = await Promise.all(
                    replies.map(async (reply) => {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('id, username, full_name, avatar_url, is_verified')
                            .eq('id', reply.user_id)
                            .single()
                        return { ...reply, profiles: profile || null }
                    })
                )
                
                return { ...comment, replies: repliesWithProfiles, showReplies: false }
            })
        )
        setComments(commentsWithReplies)
    }

    // ✅ Fetch comments with their replies
    const fetchComments = async () => {
        setLoading(true)
        try {
            // Fetch comments
            const { data: commentsData, error: commentsError } = await supabase
                .from(commentsTable)
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })
                .limit(20)

            if (commentsError) throw commentsError

            // ✅ Fetch replies separately for each comment
            const commentsWithReplies = await Promise.all(
                (commentsData || []).map(async (comment) => {
                    // Get replies
                    const { data: replies, error: repliesError } = await supabase
                        .from('comment_replies')
                        .select('*')
                        .eq('comment_id', comment.id)
                        .order('created_at', { ascending: true })
                        .limit(10)
                    
                    // If we got replies, fetch the user profiles for each reply
                    let repliesWithProfiles = []
                    if (!repliesError && replies && replies.length > 0) {
                        repliesWithProfiles = await Promise.all(
                            replies.map(async (reply) => {
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('id, username, full_name, avatar_url, is_verified')
                                    .eq('id', reply.user_id)
                                    .single()
                                
                                return {
                                    ...reply,
                                    profiles: profile || null
                                }
                            })
                        )
                    }
                    
                    return { 
                        ...comment, 
                        replies: repliesWithProfiles || [], 
                        showReplies: false 
                    }
                })
            )
            
            setComments(commentsWithReplies)
        } catch (error) {
            console.error('Error loading comments:', error)
        } finally {
            setLoading(false)
        }
    }

    // ✅ Fetch replies for a specific comment
    const fetchReplies = async (commentId) => {
        console.log('🔍 Fetching replies for comment:', commentId)
        setLoadingReplies(prev => ({ ...prev, [commentId]: true }))
        try {
            // Get replies
            const { data: replies, error: repliesError } = await supabase
                .from('comment_replies')
                .select('*')
                .eq('comment_id', commentId)
                .order('created_at', { ascending: true })
                .limit(10)

            if (repliesError) {
                console.error('❌ Error fetching replies:', repliesError)
                return
            }

            console.log('📝 Found replies:', replies?.length || 0)

            // Fetch profiles for each reply
            let repliesWithProfiles = []
            if (replies && replies.length > 0) {
                repliesWithProfiles = await Promise.all(
                    replies.map(async (reply) => {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('id, username, full_name, avatar_url, is_verified')
                            .eq('id', reply.user_id)
                            .single()
                        
                        return {
                            ...reply,
                            profiles: profile || null
                        }
                    })
                )
            }

            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    return { ...comment, replies: repliesWithProfiles || [], showReplies: true }
                }
                return comment
            }))
        } catch (error) {
            console.error('Error loading replies:', error)
        } finally {
            setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
        }
    }

    // ✅ Toggle replies visibility
    const toggleReplies = (commentId) => {
        setComments(prev => prev.map(comment => {
            if (comment.id === commentId) {
                const shouldShow = !comment.showReplies
                if (shouldShow && (!comment.replies || comment.replies.length === 0)) {
                    fetchReplies(commentId)
                    return { ...comment, showReplies: true }
                }
                return { ...comment, showReplies: shouldShow }
            }
            return comment
        }))
    }

    // ✅ Handle comment
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

            setComments(prev => [...prev, { ...data, replies: [], showReplies: false }])
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

    // ✅ Helper function to add reply to state
    const addReplyToState = async (replyData, commentId) => {
        try {
            // Fetch profile for the reply
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified')
                .eq('id', currentUser.id)
                .single()

            const replyWithProfile = {
                ...replyData,
                profiles: profile || null
            }

            console.log('📝 Adding reply to state:', replyWithProfile)

            // Update state with the new reply
            setComments(prev => {
                const updated = prev.map(comment => {
                    if (comment.id === commentId) {
                        const existingReplies = comment.replies || []
                        return { 
                            ...comment, 
                            replies: [...existingReplies, replyWithProfile],
                            showReplies: true
                        }
                    }
                    return comment
                })
                return updated
            })

            setReplyText('')
            setReplyingTo(null)
            
            if (onRefresh) {
                onRefresh()
            }
            
            console.log('✅ Reply added successfully!')
        } catch (error) {
            console.error('❌ Error adding reply to state:', error)
        }
    }

    // ✅ Handle reply - tries 'content' first, then 'text'
    const handleReply = async (commentId) => {
        if (!replyText.trim() || !currentUser) {
            console.log('No reply text or user')
            return
        }

        console.log('📝 Replying to comment:', commentId)
        console.log('📝 Reply text:', replyText)
        console.log('👤 User:', currentUser.id)

        setSubmitting(true)
        try {
            // ✅ Try with 'content' column first (most common)
            const { data: replyData, error: replyError } = await supabase
                .from('comment_replies')
                .insert({
                    comment_id: commentId,
                    user_id: currentUser.id,
                    content: replyText.trim()
                })
                .select()
                .single()

            if (replyError) {
                console.log('⚠️ "content" column failed, trying "text":', replyError.message)
                
                // ✅ Fallback: try with 'text' column
                const { data: replyData2, error: replyError2 } = await supabase
                    .from('comment_replies')
                    .insert({
                        comment_id: commentId,
                        user_id: currentUser.id,
                        text: replyText.trim()
                    })
                    .select()
                    .single()

                if (replyError2) {
                    console.error('❌ Both column attempts failed:', replyError2)
                    alert('Failed to add reply: ' + replyError2.message)
                    setSubmitting(false)
                    return
                }

                // ✅ Success with 'text' column
                console.log('✅ Success with "text" column, data:', replyData2)
                await addReplyToState(replyData2, commentId)
                setSubmitting(false)
                return
            }

            // ✅ Success with 'content' column
            console.log('✅ Success with "content" column, data:', replyData)
            await addReplyToState(replyData, commentId)
            setSubmitting(false)

        } catch (error) {
            console.error('❌ Unexpected error:', error)
            alert('Failed to add reply: ' + error.message)
            setSubmitting(false)
        }
    }

    // ✅ Handle delete reply
    const handleDeleteReply = async (commentId, replyId) => {
        if (!window.confirm('Delete this reply?')) return

        try {
            const { error } = await supabase
                .from('comment_replies')
                .delete()
                .eq('id', replyId)

            if (error) throw error

            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        replies: comment.replies.filter(r => r.id !== replyId)
                    }
                }
                return comment
            }))

            console.log('✅ Reply deleted')
        } catch (error) {
            console.error('Error deleting reply:', error)
            alert('Failed to delete reply')
        }
    }

    // Show only 3 comments initially
    const displayComments = showAllComments ? comments : comments.slice(0, 3)
    const hasMoreComments = comments.length > 3

    if (comments.length === 0 && !loading && !showAllComments) {
        return (
            <div className="py-2">
                <button
                    onClick={() => setShowAllComments(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
                >
                    <MessageCircle size={14} /> View comments
                </button>
            </div>
        )
    }

    return (
        <div>
            {displayComments.map((comment) => {
                const isOwnComment = comment.user_id === currentUser?.id
                const hasReplies = comment.replies && comment.replies.length > 0
                const showReplies = comment.showReplies
                const replyCount = comment.replies?.length || 0

                return (
                    <div key={comment.id} className="mb-3">
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                                {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                                    <div className="font-semibold flex items-center gap-1.5 text-sm">
                                        {comment.profiles?.full_name || comment.profiles?.username || 'Unknown'}
                                        {comment.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                        {isOwnComment && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(You)</span>
                                        )}
                                        {comment.user_id === postAuthorId && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Author</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800 dark:text-white break-words">{comment.text}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                    <button 
                                        onClick={() => {
                                            if (replyingTo === comment.id) {
                                                setReplyingTo(null)
                                                setReplyText('')
                                            } else {
                                                setReplyingTo(comment.id)
                                            }
                                        }}
                                        className="hover:text-green-600 transition flex items-center gap-1"
                                    >
                                        <Reply size={12} /> Reply
                                    </button>
                                    {replyCount > 0 && (
                                        <button
                                            onClick={() => {
                                                if (!showReplies && (!comment.replies || comment.replies.length === 0)) {
                                                    fetchReplies(comment.id)
                                                }
                                                toggleReplies(comment.id)
                                            }}
                                            className="hover:text-blue-600 transition flex items-center gap-1"
                                        >
                                            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                        </button>
                                    )}
                                    {loadingReplies[comment.id] && (
                                        <Loader size={12} className="animate-spin" />
                                    )}
                                </div>

                                {/* Replies */}
                                {showReplies && comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-2 space-y-2 ml-6">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="flex gap-2">
                                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                                                    {reply.profiles?.avatar_url ? (
                                                        <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={12} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-1.5">
                                                        <div className="font-semibold flex items-center gap-1.5 text-xs">
                                                            {reply.profiles?.full_name || reply.profiles?.username || 'Unknown'}
                                                            {reply.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                                            {reply.user_id === postAuthorId && (
                                                                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Author</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                                            {reply.content || reply.text || 'No content'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                                        {new Date(reply.created_at).toLocaleDateString()}
                                                        {currentUser && currentUser.id === reply.user_id && (
                                                            <button
                                                                onClick={() => handleDeleteReply(comment.id, reply.id)}
                                                                className="text-red-400 hover:text-red-600 transition"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply input */}
                                {replyingTo === comment.id && (
                                    <div className="flex gap-2 mt-2 ml-6">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Reply to ${comment.profiles?.full_name || comment.profiles?.username || 'user'}...`}
                                            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                                            disabled={submitting}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleReply(comment.id)
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => handleReply(comment.id)}
                                            disabled={submitting || !replyText.trim()}
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {submitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                                            Reply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}

            {hasMoreComments && (
                <button
                    onClick={() => setShowAllComments(!showAllComments)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
                >
                    {showAllComments ? (
                        <>Show less <ChevronUp size={14} /></>
                    ) : (
                        <>View all {comments.length} comments <ChevronDown size={14} /></>
                    )}
                </button>
            )}

            <form onSubmit={handleComment} className="flex gap-2 mt-3">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    disabled={submitting}
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                    {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    Post
                </button>
            </form>
        </div>
    )
}