 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  MessageCircle, 
  Trash2,
  Edit2,
  X,
  Save,
  BarChart3,
  UserPlus,
  Copy,
  Check,
  Ticket,
  Hash,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react'
import ReactionButtons from './ReactionButtons'
import CommentSection from './CommentSection'
import VerifiedBadge from './VerifiedBadge'
import ProfilePicture from './ProfilePicture'

export default function PostCard({ post, onRefresh, currentUser }) {
    const [showComments, setShowComments] = useState(false)
    const [userReaction, setUserReaction] = useState(null)
    const [reactions, setReactions] = useState({
        like: 0,
        dislike: 0,
        laugh: 0,
        wow: 0,
        sad: 0,
        angry: 0
    })
    const [isLiking, setIsLiking] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState(post.text || '')
    const [isSaving, setIsSaving] = useState(false)
    const [likesCount, setLikesCount] = useState(post.likes_count || 0)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (post.reactions) {
            const counts = { like: 0, dislike: 0, laugh: 0, wow: 0, sad: 0, angry: 0 }
            post.reactions.forEach(r => {
                if (counts.hasOwnProperty(r.type)) {
                    counts[r.type]++
                }
            })
            setReactions(counts)
        }

        if (currentUser && post.reactions) {
            const userReact = post.reactions.find(r => r.user_id === currentUser.id)
            if (userReact) {
                setUserReaction(userReact.type)
            }
        }

        if (currentUser && post.user_id && post.user_id !== currentUser.id) {
            checkFollowStatus()
        }
    }, [post.reactions, currentUser, post.user_id])

    const checkFollowStatus = async () => {
        if (!currentUser || !post.user_id) return
        try {
            const { data, error } = await supabase
                .from('followers')
                .select('id')
                .eq('follower_id', currentUser.id)
                .eq('following_id', post.user_id)
                .maybeSingle()

            if (error) throw error
            setIsFollowing(!!data)
        } catch (error) {
            console.error('Error checking follow status:', error)
        }
    }

    const handleFollowToggle = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!currentUser) {
            alert('Please sign in to follow users')
            return
        }

        if (post.user_id === currentUser.id) return

        setFollowLoading(true)
        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('followers')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', post.user_id)

                if (error) throw error
                setIsFollowing(false)
            } else {
                const { error } = await supabase
                    .from('followers')
                    .insert({
                        follower_id: currentUser.id,
                        following_id: post.user_id
                    })

                if (error) throw error
                setIsFollowing(true)
            }
        } catch (error) {
            console.error('Error toggling follow:', error)
        } finally {
            setFollowLoading(false)
        }
    }

    const handleReaction = async (type) => {
        if (!currentUser) {
            alert('Please go to the Feed page to react to posts.')
            return
        }

        if (isLiking) return
        setIsLiking(true)

        let newUserReaction = userReaction
        let newReactions = { ...reactions }
        let newLikesCount = likesCount

        if (userReaction === type) {
            newUserReaction = null
            newReactions[type] = Math.max(0, newReactions[type] - 1)
            newLikesCount = Math.max(0, newLikesCount - 1)
        } else {
            if (userReaction) {
                newReactions[userReaction] = Math.max(0, newReactions[userReaction] - 1)
            }
            newUserReaction = type
            newReactions[type] = newReactions[type] + 1
            newLikesCount = newLikesCount + 1
        }

        setUserReaction(newUserReaction)
        setReactions(newReactions)
        setLikesCount(newLikesCount)

        try {
            if (userReaction === type) {
                await supabase
                    .from('post_reactions')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', currentUser.id)
            } else {
                if (userReaction) {
                    await supabase
                        .from('post_reactions')
                        .delete()
                        .eq('post_id', post.id)
                        .eq('user_id', currentUser.id)
                }

                await supabase
                    .from('post_reactions')
                    .insert({
                        post_id: post.id,
                        user_id: currentUser.id,
                        type: type
                    })
            }

            await supabase
                .from('posts')
                .update({ likes_count: newLikesCount })
                .eq('id', post.id)

            if (userReaction !== type) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: post.user_id,
                        from_user_id: currentUser.id,
                        type: 'like',
                        message: `${currentUser?.full_name || currentUser?.username || 'Someone'} liked your post`,
                        post_id: post.id
                    })
            }

        } catch (error) {
            console.error('Error reacting:', error)
        } finally {
            setIsLiking(false)
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await supabase.from('posts').delete().eq('id', post.id)
                if (onRefresh) onRefresh()
            } catch (error) {
                console.error('Error deleting post:', error)
                alert('Failed to delete post')
            }
        }
    }

    const handleEdit = () => {
        setEditedText(post.text || '')
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditedText(post.text || '')
    }

    const handleSaveEdit = async () => {
        if (!editedText.trim()) {
            alert('Post cannot be empty')
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('posts')
                .update({ text: editedText.trim() })
                .eq('id', post.id)

            if (error) throw error

            setIsEditing(false)
            post.text = editedText.trim()
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error('Error updating post:', error)
            alert('Failed to update post. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const parseSlipContent = (text) => {
        if (!text) return null
        
        const lines = text.split('\n').filter(line => line.trim() !== '')
        const matches = []
        let currentMatch = null
        let totalReturn = null
        
        for (const line of lines) {
            if (line.includes('📊 Multi-Market Bet Slip')) continue
            if (line.includes('━━━━━━━━━━━━━━━━━━━━━━━━━')) continue
            
            if (line.includes('💰 Total Potential Return:')) {
                const match = line.match(/💰 Total Potential Return:\s*([\d.]+)x/)
                if (match) {
                    totalReturn = match[1]
                }
                continue
            }
            
            const matchNumberMatch = line.match(/^(\d+)\.\s+(.+?)\s+vs\s+(.+)$/)
            if (matchNumberMatch) {
                if (currentMatch && currentMatch.markets.length > 0) {
                    matches.push(currentMatch)
                }
                currentMatch = {
                    homeTeam: matchNumberMatch[2].trim(),
                    awayTeam: matchNumberMatch[3].trim(),
                    markets: []
                }
                continue
            }
            
            if (currentMatch && line.includes('•')) {
                const marketMatch = line.match(/•\s+(.+?):\s+(.+?)\s+\(([\d.]+)\)/)
                if (marketMatch) {
                    currentMatch.markets.push({
                        name: marketMatch[1].trim(),
                        pick: marketMatch[2].trim(),
                        odds: marketMatch[3]
                    })
                }
                continue
            }
            
            if (currentMatch && line.includes('Total Odds:')) {
                const oddsMatch = line.match(/Total Odds:\s*([\d.]+)/)
                if (oddsMatch) {
                    currentMatch.totalOdds = oddsMatch[1]
                }
                continue
            }
        }
        
        if (currentMatch && currentMatch.markets.length > 0) {
            matches.push(currentMatch)
        }
        
        return { matches, totalReturn }
    }

    const copySlipToClipboard = (e) => {
        e.stopPropagation()
        if (!post.text) return
        
        navigator.clipboard.writeText(post.text)
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(() => {
                alert('Failed to copy slip')
            })
    }

    const renderSlipCard = () => {
        const parsed = parseSlipContent(post.text)
        if (!parsed || parsed.matches.length === 0) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-sm">
                    <div className="whitespace-pre-wrap text-gray-800">
                        {post.text}
                    </div>
                </div>
            )
        }

        const { matches, totalReturn } = parsed

        return (
            <div className="relative">
                {/* ✅ Top Accent Bar - Makes it stand out */}
                <div className="absolute -top-0.5 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 rounded-t-xl"></div>
                
                {/* ✅ Slip Label Badge */}
                <div className="absolute -top-2 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1.5 z-10">
                    <Ticket size={10} />
                    SLIP
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 pt-5 shadow-md relative overflow-hidden">
                    {/* ✅ Subtle Background Pattern - Watermark Ticket Icon */}
                    <div className="absolute -bottom-6 -right-6 opacity-5">
                        <Ticket size={120} />
                    </div>

                    {/* Copy Button */}
                    <button
                        onClick={copySlipToClipboard}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition z-10"
                        title="Copy slip"
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>

                    {/* Header */}
                    <div className="text-center mb-3">
                        <div className="flex items-center justify-center gap-2 text-gray-800 font-bold text-sm tracking-wider">
                            <Ticket size={16} className="text-blue-600" />
                            <span>BET SLIP</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>
                    </div>

                    {/* Matches */}
                    {matches.map((match, index) => (
                        <div key={index} className="mb-3">
                            {/* Match Header */}
                            <div className="text-gray-800 font-semibold text-sm flex items-center gap-1.5">
                                <span className="text-blue-500 font-bold text-xs bg-blue-50 px-1.5 py-0.5 rounded">
                                    {index + 1}
                                </span>
                                <span>{match.homeTeam} vs {match.awayTeam}</span>
                            </div>
                            
                            {/* Markets */}
                            {match.markets.map((market, i) => (
                                <div key={i} className="flex justify-between text-gray-600 text-sm ml-6 mt-0.5">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        {market.name}: {market.pick}
                                    </span>
                                    <span className="text-green-600 font-medium">@{market.odds}</span>
                                </div>
                            ))}
                            
                            {/* Match Total Odds */}
                            {match.totalOdds && (
                                <div className="flex justify-between text-blue-600 text-sm mt-1 ml-6 bg-blue-50 px-2 py-0.5 rounded">
                                    <span className="flex items-center gap-1.5">
                                        <TrendingUp size={10} />
                                        Combined Odds
                                    </span>
                                    <span className="font-bold">{match.totalOdds}</span>
                                </div>
                            )}
                            
                            {/* Separator between matches */}
                            {index < matches.length - 1 && (
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>
                            )}
                        </div>
                    ))}

                    {/* Footer */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-green-600 font-bold flex items-center gap-1.5 text-sm">
                            <DollarSign size={14} />
                            Total Return: {totalReturn || '0.00'}x
                        </span>
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(post.created_at).toLocaleDateString()} • {matches.reduce((acc, m) => acc + m.markets.length, 0)} picks
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    if (isEditing) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <ProfilePicture size="md" userId={post.profiles?.id} />
                        <div>
                            <div className="font-semibold text-gray-800">
                                {post.profiles?.full_name || post.profiles?.username || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">Editing post...</div>
                        </div>
                    </div>
                    <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white text-gray-800 resize-none"
                    rows="4"
                    placeholder="What's on your mind?"
                />

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveEdit}
                        disabled={isSaving || !editedText.trim()}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-1"
                    >
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        )
    }

    const showFollowIcon = currentUser && post.user_id && post.user_id !== currentUser.id && !isFollowing
    const isSlipPost = post.text && post.text.includes('📊 Multi-Market Bet Slip')

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    <Link to={`/profile/${post.profiles?.id}`} className="flex items-center gap-3 hover:opacity-80 flex-1">
                        <ProfilePicture size="md" userId={post.profiles?.id} />
                        <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                                {post.profiles?.full_name || post.profiles?.username || 'Unknown'}
                                {post.profiles?.is_verified && <VerifiedBadge size="sm" />}
                            </div>
                            <div className="text-sm text-gray-500">
                                @{post.profiles?.username || 'user'} • {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {post.updated_at && post.updated_at !== post.created_at && (
                                    <span className="text-xs text-gray-400 ml-1">(edited)</span>
                                )}
                            </div>
                        </div>
                    </Link>

                    {showFollowIcon && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition flex-shrink-0 ml-2 bg-green-600 text-white hover:bg-green-700"
                            title={`Follow @${post.profiles?.username}`}
                        >
                            {followLoading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <UserPlus size={14} />
                            )}
                        </button>
                    )}

                    {post.user_id === currentUser?.id && (
                        <div className="flex items-center gap-1 ml-2">
                            <button 
                                onClick={handleEdit}
                                className="text-gray-400 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-blue-50"
                                title="Edit post"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={handleDelete} 
                                className="text-gray-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
                                title="Delete post"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-2">
                {isSlipPost ? (
                    renderSlipCard()
                ) : (
                    <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
                )}
                
                {post.image && (
                    <img src={post.image} alt="Post image" className="mt-3 rounded-lg max-h-96 w-full object-contain bg-gray-100" loading="lazy" />
                )}
            </div>

            {post.prediction_data && post.prediction_data.markets ? (
                <div className="px-4 pb-2">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Multi-Market Prediction</span>
                        </div>
                        <div className="space-y-1">
                            {post.prediction_data.markets.map((m, i) => (
                                <div key={i} className="flex justify-between text-sm text-gray-600">
                                    <span>{m.label}: <strong>{m.pick}</strong></span>
                                    <span className="text-gray-400">@{m.odds?.toFixed(2) || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : post.prediction_data && post.prediction_data.result ? (
                <div className="px-4 pb-2">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                            <span>Result: {post.prediction_data.result || 'Draw'}</span>
                            <span>🟨 {post.prediction_data.yellowCards || 0} 🟥 {post.prediction_data.redCards || 0}</span>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="px-4 py-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        {Object.entries(reactions).filter(([_, count]) => count > 0).length > 0 ? (
                            <>
                                {reactions.like > 0 && <span>❤️</span>}
                                {reactions.laugh > 0 && <span>😂</span>}
                                {reactions.wow > 0 && <span>😮</span>}
                                {reactions.sad > 0 && <span>😢</span>}
                                {reactions.angry > 0 && <span>😡</span>}
                                <span className="ml-1">{Object.values(reactions).reduce((a, b) => a + b, 0)}</span>
                            </>
                        ) : (
                            <span>No reactions yet</span>
                        )}
                    </div>
                    <button onClick={() => setShowComments(!showComments)} className="hover:text-gray-800 transition flex items-center gap-1">
                        <MessageCircle size={16} /> {post.comments?.length || 0} comments
                    </button>
                </div>
            </div>

            <div className="px-4 py-2 border-t border-gray-100">
                <ReactionButtons onReact={handleReaction} userReaction={userReaction} reactions={reactions} />
            </div>

            {showComments && (
                <div className="px-4 py-3 border-t border-gray-100">
                    <CommentSection 
                        postId={post.id} 
                        comments={post.comments || []} 
                        onRefresh={onRefresh} 
                        currentUser={currentUser}
                        postAuthorId={post.user_id}
                    />
                </div>
            )}
        </div>
    )
}