 import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link, useLocation } from 'react-router-dom'
import { 
  Rss, 
  Image as ImageIcon, 
  Send, 
  Users as UsersIcon,
  Filter,
  X,
  ShoppingBag,
  Search,
  User,
  Loader
} from 'lucide-react'
import PostCard from '../components/PostCard'
import PredictionCard from '../components/PredictionCard'
import BouncingLoader from '../components/BouncingLoader'
import { uploadImage } from '../services/uploadService'

export default function Feed() {
    const { user, profile } = useAuth()
    const { showToast } = useToast()
    const location = useLocation()
    const [feedItems, setFeedItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(0)
    const [newPost, setNewPost] = useState('')
    const [posting, setPosting] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [showUserSearch, setShowUserSearch] = useState(false)
    const fileInputRef = useRef(null)
    const searchTimeoutRef = useRef(null)
    const [sharedSlip, setSharedSlip] = useState(null)
    const [highlightedPostId, setHighlightedPostId] = useState(null)
    const [initialLoad, setInitialLoad] = useState(true)
    const observerRef = useRef(null)
    const POSTS_PER_PAGE = 15
    const hasMoreRef = useRef(true) // ✅ Use ref to track hasMore

    // ✅ READ THE HIGHLIGHT ID FROM THE URL
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const highlightId = params.get('highlight')
        if (highlightId) {
            setHighlightedPostId(highlightId)
        }
    }, [location.search])

    useEffect(() => {
        const sharedSlipData = localStorage.getItem('predictfc_share_slip')
        if (sharedSlipData) {
            try {
                const slip = JSON.parse(sharedSlipData)
                if (slip.length > 0) {
                    setSharedSlip(slip)
                    const text = `📊 Multi-Market Bet Slip:\n${slip.map(item => 
                        `${item.homeTeam} vs ${item.awayTeam}: ${item.markets.map(m => m.pick).join(', ')}`
                    ).join('\n')}`
                    setNewPost(text)
                }
            } catch (e) {
                console.error('Error reading shared slip:', e)
            }
            localStorage.removeItem('predictfc_share_slip')
        }
    }, [])

    // ✅ Load feed with pagination - FIXED
    const loadFeed = useCallback(async (reset = true) => {
        if (!user) return

        try {
            let currentPage
            if (reset) {
                setFeedItems([])
                currentPage = 0
                setPage(0)
                setHasMore(true)
                hasMoreRef.current = true
                setLoading(true)
            } else {
                // ✅ Don't load more if already loading or no more
                if (loadingMore || !hasMoreRef.current) return
                setLoadingMore(true)
                currentPage = page
            }

            const start = currentPage * POSTS_PER_PAGE
            const end = start + POSTS_PER_PAGE - 1

            console.log(`📰 Loading feed: page=${currentPage}, start=${start}, end=${end}`)

            // Get posts
            let postsQuery = supabase
                .from('posts')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified),
                    comments:post_comments (
                        *,
                        profiles:user_id (id, username, full_name, avatar_url, is_verified)
                    ),
                    reactions:post_reactions (id, user_id, type)
                `)
                .order('created_at', { ascending: false })
                .range(start, end)

            // Following filter
            if (filter === 'following' && user) {
                const { data: following } = await supabase
                    .from('followers')
                    .select('following_id')
                    .eq('follower_id', user.id)

                const followingIds = following?.map(f => f.following_id) || []
                if (followingIds.length > 0) {
                    postsQuery = postsQuery.in('user_id', followingIds)
                } else {
                    if (reset) {
                        setFeedItems([])
                        setLoading(false)
                        setHasMore(false)
                        hasMoreRef.current = false
                    }
                    setLoadingMore(false)
                    return
                }
            }

            const { data: postsData, error: postsError } = await postsQuery
            if (postsError) throw postsError

            // Get predictions
            let predictionsQuery = supabase
                .from('public_predictions')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, avatar_url, is_verified)
                `)
                .order('created_at', { ascending: false })
                .range(start, end)

            if (filter === 'following' && user) {
                const { data: following } = await supabase
                    .from('followers')
                    .select('following_id')
                    .eq('follower_id', user.id)

                const followingIds = following?.map(f => f.following_id) || []
                if (followingIds.length > 0) {
                    predictionsQuery = predictionsQuery.in('user_id', followingIds)
                }
            }

            const { data: predictionsData, error: predictionsError } = await predictionsQuery
            if (predictionsError) throw predictionsError

            // Combine and sort
            const combined = [
                ...(postsData || []).map(item => ({ ...item, type: 'post' })),
                ...(predictionsData || []).map(item => ({ ...item, type: 'prediction' }))
            ]

            combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            console.log(`📰 Found ${combined.length} items for page ${currentPage}`)

            // ✅ Check if we have more items
            const hasMoreItems = combined.length === POSTS_PER_PAGE
            hasMoreRef.current = hasMoreItems

            if (reset) {
                setFeedItems(combined)
                setHasMore(hasMoreItems)
                setPage(1) // ✅ Set page to 1 after first load
            } else {
                // ✅ Append new items
                setFeedItems(prev => [...prev, ...combined])
                setHasMore(hasMoreItems)
                setPage(prev => prev + 1)
            }

            console.log(`📰 Has more: ${hasMoreItems}`)

        } catch (error) {
            console.error('Error loading feed:', error)
            showToast('Failed to load feed', 'error')
        } finally {
            if (reset) {
                setLoading(false)
                setInitialLoad(false)
            }
            setLoadingMore(false)
        }
    }, [filter, user, page, loadingMore, showToast, POSTS_PER_PAGE])

    // ✅ Initial load
    useEffect(() => {
        if (user) {
            loadFeed(true)
        }
    }, [filter, user])

    // ✅ Infinite scroll observer - FIXED
    useEffect(() => {
        if (!user) return
        
        // ✅ Disconnect previous observer
        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        // ✅ Only setup observer if we have more items
        if (!hasMore || loading || loadingMore) {
            return
        }

        const target = document.getElementById('load-more-trigger')
        if (!target) {
            console.log('⚠️ Load more trigger not found in DOM')
            return
        }

        console.log('👀 Setting up intersection observer...')

        observerRef.current = new IntersectionObserver((entries) => {
            const entry = entries[0]
            if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
                console.log('🔄 Intersection triggered - loading more...')
                loadFeed(false)
            }
        }, { 
            threshold: 0.1, 
            rootMargin: '200px' // ✅ Increased rootMargin
        })

        observerRef.current.observe(target)

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [hasMore, loading, loadingMore, loadFeed, user])

    // ✅ SCROLL TO THE HIGHLIGHTED POST
    useEffect(() => {
        if (highlightedPostId && !loading && feedItems.length > 0) {
            setTimeout(() => {
                const element = document.getElementById(`post-${highlightedPostId}`)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.style.border = '2px solid #1a1a1a'
                    element.style.boxShadow = '0 0 30px rgba(0,0,0,0.15)'
                    element.style.borderRadius = '12px'
                    setTimeout(() => {
                        element.style.border = ''
                        element.style.boxShadow = ''
                        element.style.borderRadius = ''
                    }, 5000)
                }
            }, 300)
        }
    }, [highlightedPostId, loading, feedItems])

    const handleUserSearch = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            setShowUserSearch(false)
            return
        }

        setSearching(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, is_verified')
                .ilike('username', `%${query}%`)
                .limit(5)

            if (error) throw error
            setSearchResults(data || [])
            setShowUserSearch(data && data.length > 0)
        } catch (error) {
            console.error('User search error:', error)
        } finally {
            setSearching(false)
        }
    }

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (searchQuery.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                handleUserSearch(searchQuery)
            }, 300)
        } else {
            setSearchResults([])
            setShowUserSearch(false)
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery])

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image too large. Max 5MB.', 'error')
                return
            }
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onload = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCreatePost = async (e) => {
        e.preventDefault()
        if (!newPost.trim() && !selectedImage) {
            showToast('Please write something or add an image', 'warning')
            return
        }

        setPosting(true)
        try {
            let imageUrl = null
            
            if (selectedImage) {
                try {
                    imageUrl = await uploadImage(selectedImage, user.id, 'post-images')
                } catch (error) {
                    showToast('Failed to upload image: ' + error.message, 'error')
                    setPosting(false)
                    return
                }
            }

            const { data, error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    text: newPost.trim(),
                    image: imageUrl,
                    likes_count: 0,
                    comments_count: 0
                })
                .select()
                .single()

            if (error) throw error

            showToast('Post shared successfully!', 'success')
            setNewPost('')
            setSharedSlip(null)
            removeImage()
            loadFeed(true)
        } catch (error) {
            console.error('Error creating post:', error)
            showToast('Failed to create post', 'error')
        } finally {
            setPosting(false)
        }
    }

    const renderFeedItem = (item) => {
        if (item.type === 'post') {
            return (
                <div id={`post-${item.id}`} key={item.id}>
                    <PostCard
                        post={item}
                        onRefresh={() => loadFeed(true)}
                        currentUser={user}
                    />
                </div>
            )
        } else {
            return (
                <PredictionCard
                    key={`${item.id}-${item.likes_count || 0}`}
                    prediction={item}
                    onRefresh={() => loadFeed(true)}
                    currentUser={user}
                />
            )
        }
    }

    if (initialLoad && loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex justify-center py-12">
                    <BouncingLoader size="xl" color="green" text="Loading feed..." />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Rss size={24} /> Feed
                    </h1>
                    <p className="text-gray-400 text-sm">Social posts and public predictions from the community</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setFilter('all')
                            loadFeed(true)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                            filter === 'all'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <Filter size={16} /> All
                    </button>
                    <button
                        onClick={() => {
                            setFilter('following')
                            loadFeed(true)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                            filter === 'following'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        <UsersIcon size={16} /> Following
                    </button>
                </div>
            </div>

            {/* User Search */}
            <div className="relative mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for users..."
                        className="w-full px-4 py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('')
                                setSearchResults([])
                                setShowUserSearch(false)
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {searching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader size={16} className="animate-spin text-gray-400" />
                        </div>
                    )}
                </div>

                {showUserSearch && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                        {searchResults.map((result) => (
                            <Link
                                key={result.id}
                                to={`/profile/${result.id}`}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                                onClick={() => {
                                    setSearchQuery('')
                                    setSearchResults([])
                                    setShowUserSearch(false)
                                }}
                            >
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                    {result.avatar_url ? (
                                        <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        {result.full_name || result.username}
                                        {result.is_verified && (
                                            <span className="text-blue-500 text-sm">✓</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400">@{result.username}</div>
                                </div>
                                <span className="ml-auto text-xs text-gray-400">View Profile →</span>
                            </Link>
                        ))}
                    </div>
                )}
                {showUserSearch && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-20 p-4 text-center text-gray-400">
                        No users found for "{searchQuery}"
                    </div>
                )}
            </div>

            {/* Create Post */}
            {user && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                profile?.username?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <span className="font-semibold text-gray-700">
                            {profile?.full_name || profile?.username || 'User'}
                        </span>
                        {sharedSlip && (
                            <span className="ml-auto text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                                <ShoppingBag size={12} /> Slip Ready
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleCreatePost}>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder={sharedSlip ? "Your bet slip is ready! Add a comment and share..." : "What's on your mind?"}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 resize-none"
                            rows="3"
                        />

                        {imagePreview && (
                            <div className="relative mt-3">
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="max-h-64 rounded-lg object-contain bg-gray-50"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
                                >
                                    <ImageIcon size={16} /> Add Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={posting || (!newPost.trim() && !selectedImage)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-1"
                            >
                                <Send size={16} /> {posting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Feed Items */}
            {loading && feedItems.length === 0 ? (
                <div className="flex justify-center py-12">
                    <BouncingLoader size="lg" color="green" text="Loading feed..." />
                </div>
            ) : feedItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Rss className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Your feed is empty</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">Start by sharing a post or following other users.</p>
                    <div className="flex gap-4 justify-center mt-6 flex-wrap">
                        <Link 
                            to="/matches"
                            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition"
                        >
                            Make a Prediction
                        </Link>
                        <button
                            onClick={() => document.querySelector('textarea')?.focus()}
                            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                            Create Post
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-6">
                        {feedItems.map(renderFeedItem)}
                    </div>
                    
                    {/* ✅ Infinite Scroll Trigger */}
                    <div id="load-more-trigger" className="flex justify-center py-6">
                        {loadingMore ? (
                            <BouncingLoader size="sm" color="green" text="Loading more..." />
                        ) : hasMore ? (
                            <p className="text-gray-400 text-sm animate-pulse">↓ Scroll for more ↓</p>
                        ) : (
                            <p className="text-gray-400 text-sm">🎉 You've seen all posts!</p>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}