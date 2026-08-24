 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  Globe, 
  Lock, 
  User,
  Share2,
  Calendar,
  Trophy,
  BarChart3   // ✅ Added this missing import
} from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import FollowButton from './follow/FollowButton'
import ProfilePicture from './ProfilePicture'

export default function PredictionCard({ prediction, onRefresh, currentUser }) {
    const [isLiked, setIsLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(prediction.likes_count || 0)
    const [liking, setLiking] = useState(false)

    useEffect(() => {
        if (currentUser) {
            checkLikeStatus()
        }
    }, [prediction.id, currentUser])

    const checkLikeStatus = async () => {
        try {
            const { data } = await supabase
                .from('public_prediction_likes')
                .select('id')
                .eq('prediction_id', prediction.id)
                .eq('user_id', currentUser.id)
                .maybeSingle()
            setIsLiked(!!data)
        } catch (error) {
            console.error('Error checking like status:', error)
        }
    }

    const handleLike = async () => {
        if (!currentUser) {
            alert('Please sign in to like')
            return
        }
        if (liking) return
        setLiking(true)

        try {
            if (isLiked) {
                await supabase
                    .from('public_prediction_likes')
                    .delete()
                    .eq('prediction_id', prediction.id)
                    .eq('user_id', currentUser.id)

                await supabase
                    .from('public_predictions')
                    .update({ likes_count: Math.max(0, likesCount - 1) })
                    .eq('id', prediction.id)

                setIsLiked(false)
                setLikesCount(prev => prev - 1)
            } else {
                await supabase
                    .from('public_prediction_likes')
                    .insert({
                        prediction_id: prediction.id,
                        user_id: currentUser.id
                    })

                await supabase
                    .from('public_predictions')
                    .update({ likes_count: likesCount + 1 })
                    .eq('id', prediction.id)

                setIsLiked(true)
                setLikesCount(prev => prev + 1)
            }

            if (onRefresh) onRefresh()
        } catch (error) {
            console.error('Error in handleLike:', error)
            alert('Failed to like prediction. Please try again.')
        } finally {
            setLiking(false)
        }
    }

    const data = prediction.prediction_data || {}
    const homeTeam = data.homeTeam || prediction.home_team || ''
    const awayTeam = data.awayTeam || prediction.away_team || ''
    const matchName = data.matchName || prediction.match_name || ''
    
    let matchDisplay = matchName
    if (!matchDisplay && homeTeam && awayTeam) {
        matchDisplay = `${homeTeam} vs ${awayTeam}`
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
                <Link to={`/profile/${prediction.profiles?.id}`} className="flex items-center gap-3 hover:opacity-80 flex-1">
                    <ProfilePicture size="md" userId={prediction.profiles?.id} />
                    <div>
                        <div className="font-semibold flex items-center gap-1.5 text-gray-800">
                            {prediction.profiles?.full_name || prediction.profiles?.username || 'Unknown'}
                            {prediction.profiles?.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-sm text-gray-400">@{prediction.profiles?.username || 'user'}</div>
                    </div>
                </Link>
                {prediction.user_id && prediction.user_id !== currentUser?.id && (
                    <FollowButton 
                        userId={prediction.user_id} 
                        username={prediction.profiles?.username}
                        onFollowChange={onRefresh}
                    />
                )}
            </div>

            {matchDisplay && (
                <div className="bg-gray-50 rounded-lg p-2 mb-3 border border-gray-100 text-center">
                    <div className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                        <Trophy size={14} className="text-gray-400" />
                        {matchDisplay}
                    </div>
                </div>
            )}

            {data.markets && data.markets.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Multi-Market Prediction</span>
                    </div>
                    <div className="space-y-1">
                        {data.markets.map((m, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-600">
                                <span>{m.label}: <strong>{m.pick}</strong></span>
                                <span className="text-gray-400">@{m.odds?.toFixed(2) || '—'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                        <Globe size={12} /> Public Prediction
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-lg">{data.result === 'Home Win' ? '🏠' : data.result === 'Away Win' ? '✈️' : '🤝'}</span>
                        <span className="font-bold text-gray-800">{data.result || 'Draw'}</span>
                        <span className="text-sm text-gray-500">🟨{data.yellowCards || 0} 🟥{data.redCards || 0}</span>
                        <span className="text-sm text-gray-500">🏁{data.corners || 0}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center mt-1 flex items-center justify-center gap-1">
                        <Globe size={12} /> Public Prediction
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between text-sm">
                <button 
                    onClick={handleLike} 
                    disabled={liking} 
                    className={`flex items-center gap-1 transition ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                    {isLiked ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />} {likesCount}
                </button>
                <span className="text-gray-400 flex items-center gap-1">
                    <Calendar size={14} /> {new Date(prediction.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    )
}