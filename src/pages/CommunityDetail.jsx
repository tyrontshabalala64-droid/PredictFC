 import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import VerifiedBadge from '../components/VerifiedBadge'
import { uploadImage } from '../services/uploadService'
import ReactionButtons from '../components/ReactionButtons'
import CommentSection from '../components/CommentSection'
import { 
  Image, 
  Video, 
  X, 
  Loader,
  Play,
  Heart,
  Maximize2,
  Minimize2,
  BarChart3,
  Crown,
  Users,
  FileText,
  DollarSign,
  Lock,
  Building2,
  CheckCircle,
  MessageCircle
} from 'lucide-react'

export default function CommunityDetail() {
    const { id } = useParams()
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [community, setCommunity] = useState(null)
    const [posts, setPosts] = useState([])
    const [isMember, setIsMember] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [newPost, setNewPost] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState(null)
    const [mediaPreview, setMediaPreview] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [fullscreenVideo, setFullscreenVideo] = useState(null)
    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const observerRef = useRef(null)

    const POSTS_PER_PAGE = 10

    // ✅ Load community and initial posts
    const loadCommunityData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: communityData } = await supabase
                .from('communities')
                .select('*, profiles:creator_id (id, username, full_name, avatar_url, is_verified)')
                .eq('id', id)
                .single()

            setCommunity(communityData)
            setIsCreator(user?.id === communityData?.creator_id)

            if (user) {
                const { data: memberData } = await supabase
                    .from('community_members')
                    .select('*')
                    .eq('community_id', id)
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .maybeSingle()
                setIsMember(!!memberData)
            }

            const { data: postsData, error: postsError } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified),
                    likes:community_post_likes (id, user_id, type)
                `)
                .eq('community_id', id)
                .order('created_at', { ascending: false })
                .range(0, POSTS_PER_PAGE - 1)

            if (postsError) {
                console.error('❌ Error fetching posts:', postsError)
                setPosts([])
            } else {
                const postsWithEmptyComments = (postsData || []).map(post => ({
                    ...post,
                    comments: [],
                    showComments: false
                }))
                setPosts(postsWithEmptyComments)

                if (postsData.length < POSTS_PER_PAGE) {
                    setHasMore(false)
                }
            }

            const { count } = await supabase
                .from('community_members')
                .select('*', { count: 'exact', head: true })
                .eq('community_id', id)
                .eq('status', 'active')

            if (communityData) {
                setCommunity({ ...communityData, member_count: count || 0 })
            }

        } catch (error) {
            console.error('❌ Error loading community:', error)
            showToast('Failed to load community data', 'error')
        } finally {
            setLoading(false)
        }
    }, [id, user, showToast])

    const loadMorePosts = useCallback(async () => {
        if (loadingMore || !hasMore) return

        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const start = nextPage * POSTS_PER_PAGE
            const end = start + POSTS_PER_PAGE - 1

            const { data: postsData, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified),
                    likes:community_post_likes (id, user_id, type)
                `)
                .eq('community_id', id)
                .order('created_at', { ascending: false })
                .range(start, end)

            if (error) {
                console.error('❌ Error loading more posts:', error)
                setLoadingMore(false)
                return
            }

            const postsWithEmptyComments = (postsData || []).map(post => ({
                ...post,
                comments: [],
                showComments: false
            }))

            setPosts(prev => [...prev, ...postsWithEmptyComments])
            setPage(nextPage)

            if (postsData.length < POSTS_PER_PAGE) {
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading more posts:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [id, page, hasMore, loadingMore])

    useEffect(() => {
        if (loading) return

        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                loadMorePosts()
            }
        }, { threshold: 0.1, rootMargin: '100px' })

        const target = document.getElementById('load-more-trigger')
        if (target) {
            observerRef.current.observe(target)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, hasMore, loadingMore, loadMorePosts])

    const refreshCommunityHeader = useCallback(async () => {
        try {
            const { data: communityData } = await supabase
                .from('communities')
                .select('*, profiles:creator_id (id, username, full_name, avatar_url, is_verified)')
                .eq('id', id)
                .single()
            
            if (communityData) {
                setCommunity({ ...communityData, member_count: communityData.member_count || 0 })
            }
        } catch (error) {
            console.error('Error refreshing header:', error)
        }
    }, [id])

    useEffect(() => {
        loadCommunityData()
    }, [loadCommunityData])

    const refreshPosts = useCallback(async () => {
        setPage(0)
        setHasMore(true)
        await loadCommunityData()
    }, [loadCommunityData])

    // ✅ FREE TO JOIN LOGIC
    const handleJoin = async () => {
        if (!user) {
            showToast('Please sign in to join this community', 'warning');
            navigate('/login');
            return;
        }

        try {
            await supabase
                .from('community_members')
                .insert({
                    community_id: id,
                    user_id: user.id,
                    role: 'member',
                    status: 'active',
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            await supabase
                .from('communities')
                .update({ member_count: (community?.member_count || 0) + 1 })
                .eq('id', id);

            showToast('You have joined the community!', 'success');
            setIsMember(true);
            loadCommunityData();
        } catch (error) {
            console.error('Error joining community:', error);
            showToast('Failed to join community.', 'error');
        }
    }

    const toggleFullscreen = (videoUrl) => {
        setFullscreenVideo(fullscreenVideo === videoUrl ? null : videoUrl)
    }

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && fullscreenVideo) {
                setFullscreenVideo(null)
            }
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [fullscreenVideo])

    const handleMediaSelect = (e, type) => {
        const file = e.target.files[0]
        if (!file) return

        const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
            showToast(`File too large. Max ${type === 'video' ? '50' : '10'}MB.`, 'error')
            return
        }

        if (type === 'image' && !file.type.startsWith('image/')) {
            showToast('Please select an image file.', 'error')
            return
        }
        if (type === 'video' && !file.type.startsWith('video/')) {
            showToast('Please select a video file.', 'error')
            return
        }

        if (type === 'video') {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                if (video.duration > 120) {
                    showToast('Video must be 2 minutes or less.', 'error')
                    e.target.value = ''
                    return
                }
                proceedWithMedia(file, type)
            }
            video.src = URL.createObjectURL(file)
            video.onerror = () => {
                proceedWithMedia(file, type)
            }
            return
        }

        proceedWithMedia(file, type)
    }

    const proceedWithMedia = (file, type) => {
        setSelectedMedia(file)
        setMediaType(type)
        
        const reader = new FileReader()
        reader.onload = () => {
            setMediaPreview(reader.result)
        }
        reader.readAsDataURL(file)
        
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeMedia = () => {
        setSelectedMedia(null)
        setMediaPreview(null)
        setMediaType(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCreatePost = async (e) => {
        e.preventDefault()
        if (!newPost.trim() && !selectedMedia) {
            showToast('Please write something or add media', 'warning')
            return
        }
        if (!isCreator) {
            showToast('Only the community creator can post in this community', 'error')
            return
        }

        setUploadingMedia(true)
        setSubmitting(true)

        try {
            let mediaUrl = null
            let mediaTypeSaved = null

            if (selectedMedia) {
                const bucket = mediaType === 'video' ? 'community-videos' : 'community-images'
                try {
                    mediaUrl = await uploadImage(selectedMedia, user.id, bucket)
                    mediaTypeSaved = mediaType
                } catch (error) {
                    showToast('Failed to upload media: ' + error.message, 'error')
                    setUploadingMedia(false)
                    setSubmitting(false)
                    return
                }
            }

            const postData = {
                community_id: id,
                user_id: user.id,
                text: newPost.trim() || null
            }

            if (mediaUrl) {
                postData.media_url = mediaUrl
                postData.media_type = mediaTypeSaved
            }

            const { data, error } = await supabase
                .from('community_posts')
                .insert(postData)
                .select()
                .single()

            if (error) throw error

            await supabase
                .from('communities')
                .update({ post_count: (community?.post_count || 0) + 1 })
                .eq('id', id)

            setNewPost('')
            removeMedia()
            
            await refreshPosts()
            await refreshCommunityHeader()
            
            showToast('Post created successfully!', 'success')
        } catch (error) {
            console.error('Error creating post:', error)
            showToast('Failed to create post: ' + error.message, 'error')
        } finally {
            setUploadingMedia(false)
            setSubmitting(false)
        }
    }

    const handlePostReaction = async (postId, type) => {
        if (!user) {
            showToast('Please sign in to react', 'warning')
            return
        }

        try {
            const { data: existing } = await supabase
                .from('community_post_likes')
                .select('id, type')
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .maybeSingle()

            if (existing && existing.type === type) {
                const { error } = await supabase
                    .from('community_post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id)
                    .eq('type', type)

                if (error) throw error
                await refreshPosts()
                return
            }

            if (existing) {
                const { error: deleteError } = await supabase
                    .from('community_post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id)

                if (deleteError) throw deleteError
            }

            const { error: insertError } = await supabase
                .from('community_post_likes')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    type: type
                })

            if (insertError) throw insertError

            await refreshPosts()

        } catch (error) {
            console.error('Error reacting to post:', error)
            showToast('Failed to react: ' + error.message, 'error')
        }
    }

    const canPost = isCreator

    if (loading) {
        return <div className="text-center py-12"><div className="text-gray-500">Loading...</div></div>
    }

    if (!community) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Community not found</p>
                <Link to="/community" className="text-green-600 hover:underline mt-4 block">Back to Communities</Link>
            </div>
        )
    }

    return (
        <div>
            {/* Fullscreen Video Modal */}
            {fullscreenVideo && (
                <div 
                    className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4"
                    onClick={() => setFullscreenVideo(null)}
                >
                    <div className="relative w-full max-w-7xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                        <video 
                            src={fullscreenVideo}
                            className="w-full h-full max-h-screen object-contain"
                            controls
                            autoPlay
                            playsInline
                            controlsList="nodownload"
                            preload="metadata"
                        />
                        <button
                            onClick={() => setFullscreenVideo(null)}
                            className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-3 rounded-full transition z-50"
                        >
                            <X size={24} />
                        </button>
                        <button
                            onClick={() => setFullscreenVideo(null)}
                            className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-lg transition"
                        >
                            <Minimize2 size={20} />
                        </button>
                        <p className="absolute bottom-4 left-4 text-white/60 text-sm bg-black/50 px-3 py-1 rounded">
                            Press ESC to exit fullscreen
                        </p>
                    </div>
                </div>
            )}

            {/* Community Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-green-600" />
                            <h1 className="text-2xl font-bold text-gray-800">{community.name}</h1>
                            {isCreator && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Admin</span>}
                            {isMember && !isCreator && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Member</span>}
                        </div>
                        <p className="text-gray-500 mt-1">{community.description || 'A private community for football predictions'}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Users size={14} /> {community.member_count || 0} members</span>
                            <span className="flex items-center gap-1"><FileText size={14} /> {community.post_count || 0} posts</span>
                        </div>
                    </div>
                    <div>
                        {isCreator ? (
                            <span className="text-sm bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">Creator</span>
                        ) : isMember ? (
                            <span className="text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg">Member</span>
                        ) : (
                            <button onClick={handleJoin} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium">
                                Join Free
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {canPost ? (
                <>
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                        <form onSubmit={handleCreatePost} className="space-y-3">
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={newPost} 
                                    onChange={(e) => setNewPost(e.target.value)} 
                                    placeholder="Share your community announcement..." 
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" 
                                />
                                <button 
                                    type="submit" 
                                    disabled={submitting || (!newPost.trim() && !selectedMedia)} 
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                                >
                                    {submitting ? 'Posting...' : 'Post'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <label className="cursor-pointer">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleMediaSelect(e, 'image')}
                                        className="hidden"
                                        disabled={uploadingMedia}
                                    />
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition">
                                        <Image size={16} /> Image
                                    </div>
                                </label>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => handleMediaSelect(e, 'video')}
                                        className="hidden"
                                        disabled={uploadingMedia}
                                    />
                                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition">
                                        <Video size={16} /> Video (2 min max)
                                    </div>
                                </label>
                                {uploadingMedia && (
                                    <div className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500">
                                        <Loader size={16} className="animate-spin" /> Uploading...
                                    </div>
                                )}
                            </div>

                            {mediaPreview && (
                                <div className="relative">
                                    {mediaType === 'image' ? (
                                        <img 
                                            src={mediaPreview} 
                                            alt="Preview" 
                                            className="max-h-64 rounded-lg object-contain bg-gray-50 w-full"
                                        />
                                    ) : (
                                        <div className="relative">
                                            <video 
                                                src={mediaPreview} 
                                                className="max-h-64 rounded-lg object-contain bg-black w-full"
                                                controls
                                                playsInline
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg pointer-events-none">
                                                <Play size={48} className="text-white/70" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={removeMedia}
                                        className="absolute top-2 right-2 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition"
                                    >
                                        <X size={18} />
                                    </button>
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        {mediaType === 'image' ? 'Image' : 'Video (2 min max)'}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 mt-2"><Crown size={12} className="inline mr-1" /> As the creator, your posts are highlighted</p>
                        </form>
                    </div>

                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No posts yet</p>
                            <p className="text-sm text-gray-400">Be the first to share an announcement!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isPostCreator = post.user_id === community.creator_id
                                
                                const reactionCounts = { like: 0, dislike: 0, laugh: 0, wow: 0, sad: 0, angry: 0 }
                                post.likes?.forEach(l => {
                                    if (reactionCounts.hasOwnProperty(l.type || 'like')) {
                                        reactionCounts[l.type || 'like']++
                                    }
                                })

                                const userReaction = post.likes?.find(l => l.user_id === user?.id)?.type || null

                                return (
                                    <div key={post.id} className={`bg-white rounded-xl shadow-md p-4 ${isPostCreator ? 'border-2 border-yellow-400' : ''}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                                {post.profiles?.avatar_url ? (
                                                    <img src={post.profiles.avatar_url} alt={post.profiles.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    post.profiles?.username?.[0]?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold flex items-center gap-1.5">
                                                    {post.profiles?.full_name || post.profiles?.username || 'Unknown'}
                                                    {post.profiles?.is_verified && <VerifiedBadge size="sm" />}
                                                    {isPostCreator && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full"><Crown size={12} className="inline mr-1" /> Admin</span>}
                                                </div>
                                                <div className="text-xs text-gray-400">@{post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                            <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
                                            {post.media_url && (
                                                <div className="mt-3 rounded-lg overflow-hidden bg-black/5">
                                                    {post.media_type === 'image' ? (
                                                        <img 
                                                            src={post.media_url} 
                                                            alt="Post media" 
                                                            className="w-full max-h-[500px] object-contain bg-black/5"
                                                            loading="lazy"
                                                        />
                                                    ) : post.media_type === 'video' ? (
                                                        <div className="relative group">
                                                            <video 
                                                                src={post.media_url}
                                                                className="w-full max-h-[500px] object-contain bg-black rounded-lg"
                                                                controls
                                                                playsInline
                                                                controlsList="nodownload"
                                                                preload="metadata"
                                                                ref={videoRef}
                                                            />
                                                            <button
                                                                onClick={() => toggleFullscreen(post.media_url)}
                                                                className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                                title="Fullscreen"
                                                            >
                                                                <Maximize2 size={20} />
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100 pt-2 mb-3">
                                            <ReactionButtons 
                                                onReact={(type) => handlePostReaction(post.id, type)}
                                                userReaction={userReaction}
                                                reactions={reactionCounts}
                                            />
                                        </div>

                                        {/* Count Row */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    ❤️ {post.likes?.length || 0}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const updatedPosts = posts.map(p => 
                                                        p.id === post.id ? { ...p, showComments: !p.showComments } : p
                                                    )
                                                    setPosts(updatedPosts)
                                                }}
                                                className="flex items-center gap-1 text-gray-400 hover:text-gray-800 transition text-sm"
                                            >
                                                <MessageCircle size={16} /> {post.comments_count || 0} comments
                                            </button>
                                        </div>

                                        {post.showComments && (
                                            <div className="border-t border-gray-100 pt-3">
                                                <CommentSection 
                                                    postId={post.id}
                                                    comments={[]}
                                                    totalCount={post.comments_count || 0}
                                                    onRefresh={() => {
                                                        refreshPosts()
                                                        refreshCommunityHeader()
                                                    }}
                                                    currentUser={user}
                                                    postAuthorId={post.user_id}
                                                    isCommunity={true}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            
                            {/* Infinite Scroll Trigger */}
                            {loadingMore && (
                                <div className="text-center py-4">
                                    <Loader className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                                    <p className="text-sm text-gray-400 mt-2">Loading more posts...</p>
                                </div>
                            )}
                            <div id="load-more-trigger" className="h-4" />
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">This community is private</p>
                    <p className="text-sm text-gray-400">Only the creator can post in this community</p>
                    {!isMember && !isCreator && (
                        <button onClick={handleJoin} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Join Now</button>
                    )}
                    {isMember && !isCreator && <p className="mt-4 text-sm text-green-600"><CheckCircle size={14} className="inline mr-1" /> You are a member of this community</p>}
                </div>
            )}
        </div>
    )
}