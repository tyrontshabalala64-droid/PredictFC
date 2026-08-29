 import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Search, 
  Plus, 
  UserPlus,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react'
import FollowButton from '../components/follow/FollowButton'
import BouncingLoader from '../components/BouncingLoader'

export default function Community() {
    const { user, profile } = useAuth()
    const [communities, setCommunities] = useState([])
    const [myCommunities, setMyCommunities] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('my')

    useEffect(() => {
        loadCommunities()
    }, [tab, user])

    const loadCommunities = async () => {
        setLoading(true)
        try {
            const { data: allCommunities } = await supabase
                .from('communities')
                .select(`
                    *,
                    profiles:creator_id (id, username, full_name, avatar_url)
                `)
                .order('member_count', { ascending: false })

            setCommunities(allCommunities || [])

            if (user) {
                const { data: memberCommunities } = await supabase
                    .from('community_members')
                    .select(`
                        community_id,
                        communities (*)
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'active')

                const myCommunityData = memberCommunities?.map(m => m.communities) || []
                setMyCommunities(myCommunityData)
            }
        } catch (error) {
            console.error('Error loading communities:', error)
        } finally {
            setLoading(false)
        }
    }

    const renderCommunityCard = (community) => {
        const isMember = myCommunities.some(c => c.id === community.id)
        const isCreator = user?.id === community.creator_id

        return (
            <Link 
                to={`/community/${community.id}`} 
                key={community.id}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition block"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-green-600" />
                            <h3 className="font-bold text-gray-800">{community.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {community.description || 'A private community for football predictions'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Users size={14} /> {community.member_count || 0}</span>
                            <span className="flex items-center gap-1"><FileText size={14} /> {community.post_count || 0}</span>
                            <span className="flex items-center gap-1"><DollarSign size={14} /> R{community.price || 50}/month</span>
                        </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                        {isCreator ? (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Admin</span>
                        ) : isMember ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Member</span>
                        ) : (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Join</span>
                        )}
                        {!isCreator && user?.id !== community.creator_id && (
                            <FollowButton 
                                userId={community.creator_id} 
                                username={community.profiles?.username}
                            />
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={24} /> Communities
                    </h1>
                    <p className="text-gray-500">Join communities, share predictions, and connect with fans</p>
                </div>
                <Link 
                    to="/community/create"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                >
                    <Plus size={18} /> Create Community
                </Link>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('my')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                        tab === 'my' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <Users size={16} /> My Communities
                </button>
                <button
                    onClick={() => setTab('discover')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                        tab === 'discover' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <Search size={16} /> Discover
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <BouncingLoader size="lg" color="green" text="Loading communities..." />
                </div>
            ) : (
                <>
                    {tab === 'my' && (
                        <div>
                            {!user ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Please sign in to see your communities</p>
                                </div>
                            ) : myCommunities.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">You haven't joined any communities yet</p>
                                    <p className="text-sm text-gray-400">Discover communities and start predicting with friends</p>
                                    <button 
                                        onClick={() => setTab('discover')}
                                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                    >
                                        Discover Communities
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myCommunities.map(renderCommunityCard)}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'discover' && (
                        <div>
                            {communities.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No communities found</p>
                                    <p className="text-sm text-gray-400">Be the first to create a community!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {communities.map(renderCommunityCard)}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}