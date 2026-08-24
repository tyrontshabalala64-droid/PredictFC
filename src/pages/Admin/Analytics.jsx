 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Activity,
  BarChart3,
  RefreshCw,
  ChevronDown
} from 'lucide-react'

export default function Analytics() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('30d')
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsers: 0,
        totalPosts: 0,
        newPosts: 0,
        totalCommunities: 0,
        newCommunities: 0,
        totalPredictions: 0,
        newPredictions: 0
    })
    const [userGrowthData, setUserGrowthData] = useState([])
    const [postActivityData, setPostActivityData] = useState([])
    const [communityGrowthData, setCommunityGrowthData] = useState([])

    useEffect(() => {
        loadAnalytics()
    }, [timeRange])

    const getDateRange = () => {
        const now = new Date()
        let days = 30
        if (timeRange === '7d') days = 7
        else if (timeRange === '30d') days = 30
        else if (timeRange === '90d') days = 90
        else if (timeRange === '1y') days = 365
        
        const start = new Date(now)
        start.setDate(start.getDate() - days)
        return start
    }

    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const startDate = getDateRange()
            const startDateStr = startDate.toISOString()

            // Total counts
            const [
                { count: totalUsers },
                { count: totalPosts },
                { count: totalCommunities },
                { count: totalPredictions }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('posts').select('*', { count: 'exact', head: true }),
                supabase.from('communities').select('*', { count: 'exact', head: true }),
                supabase.from('public_predictions').select('*', { count: 'exact', head: true })
            ])

            // New counts (in date range)
            const [
                { count: newUsers },
                { count: newPosts },
                { count: newCommunities },
                { count: newPredictions }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr),
                supabase.from('posts').select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr),
                supabase.from('communities').select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr),
                supabase.from('public_predictions').select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr)
            ])

            setStats({
                totalUsers: totalUsers || 0,
                newUsers: newUsers || 0,
                totalPosts: totalPosts || 0,
                newPosts: newPosts || 0,
                totalCommunities: totalCommunities || 0,
                newCommunities: newCommunities || 0,
                totalPredictions: totalPredictions || 0,
                newPredictions: newPredictions || 0
            })

            // Generate chart data
            await generateChartData(startDate)

        } catch (error) {
            console.error('Error loading analytics:', error)
            showToast('Failed to load analytics', 'error')
        } finally {
            setLoading(false)
        }
    }

    const generateChartData = async (startDate) => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30
        
        const users = []
        const posts = []
        const communities = []
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)
            const nextDayStr = nextDay.toISOString()

            // Users created on this day
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', dateStr)
                .lt('created_at', nextDayStr)

            // Posts created on this day
            const { count: postCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', dateStr)
                .lt('created_at', nextDayStr)

            // Communities created on this day
            const { count: communityCount } = await supabase
                .from('communities')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', dateStr)
                .lt('created_at', nextDayStr)

            users.push({ date: dateStr, count: userCount || 0 })
            posts.push({ date: dateStr, count: postCount || 0 })
            communities.push({ date: dateStr, count: communityCount || 0 })
        }

        setUserGrowthData(users)
        setPostActivityData(posts)
        setCommunityGrowthData(communities)
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getGrowthColor = (value) => {
        return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-400'
    }

    const getGrowthIcon = (value) => {
        return value > 0 ? <TrendingUp size={16} className="text-green-600" /> : 
               value < 0 ? <TrendingDown size={16} className="text-red-600" /> : null
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">Loading analytics...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 size={24} /> Analytics
                    </h1>
                    <p className="text-gray-400 text-sm">Track your platform's growth and engagement</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none pr-8"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="1y">Last Year</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={loadAnalytics}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm flex items-center gap-2"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {getGrowthIcon(stats.newUsers)}
                        <span className={`text-xs font-medium ${getGrowthColor(stats.newUsers)}`}>
                            +{stats.newUsers} new in selected period
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total Posts</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalPosts}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity size={20} className="text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {getGrowthIcon(stats.newPosts)}
                        <span className={`text-xs font-medium ${getGrowthColor(stats.newPosts)}`}>
                            +{stats.newPosts} new in selected period
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Communities</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalCommunities}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Calendar size={20} className="text-purple-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {getGrowthIcon(stats.newCommunities)}
                        <span className={`text-xs font-medium ${getGrowthColor(stats.newCommunities)}`}>
                            +{stats.newCommunities} new in selected period
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Predictions</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalPredictions}</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <BarChart3 size={20} className="text-yellow-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {getGrowthIcon(stats.newPredictions)}
                        <span className={`text-xs font-medium ${getGrowthColor(stats.newPredictions)}`}>
                            +{stats.newPredictions} new in selected period
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* User Growth Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Users size={16} /> User Growth
                    </h3>
                    <div className="h-48">
                        {userGrowthData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No data available
                            </div>
                        ) : (
                            <div className="flex items-end h-full gap-1">
                                {userGrowthData.map((item, index) => {
                                    const max = Math.max(...userGrowthData.map(d => d.count), 1)
                                    const height = (item.count / max) * 100
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center">
                                            <div 
                                                className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer"
                                                style={{ height: `${Math.max(height, 2)}%` }}
                                                title={`${formatDate(item.date)}: ${item.count} new users`}
                                            />
                                            <span className="text-[8px] text-gray-400 mt-1 rotate-45 origin-left">
                                                {formatDate(item.date)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Activity Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Activity size={16} /> Post Activity
                    </h3>
                    <div className="h-48">
                        {postActivityData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No data available
                            </div>
                        ) : (
                            <div className="flex items-end h-full gap-1">
                                {postActivityData.map((item, index) => {
                                    const max = Math.max(...postActivityData.map(d => d.count), 1)
                                    const height = (item.count / max) * 100
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center">
                                            <div 
                                                className="w-full bg-green-500 rounded-t hover:bg-green-600 transition cursor-pointer"
                                                style={{ height: `${Math.max(height, 2)}%` }}
                                                title={`${formatDate(item.date)}: ${item.count} new posts`}
                                            />
                                            <span className="text-[8px] text-gray-400 mt-1 rotate-45 origin-left">
                                                {formatDate(item.date)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Community Growth Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar size={16} /> Community Growth
                </h3>
                <div className="h-48">
                    {communityGrowthData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            No data available
                        </div>
                    ) : (
                        <div className="flex items-end h-full gap-1">
                            {communityGrowthData.map((item, index) => {
                                const max = Math.max(...communityGrowthData.map(d => d.count), 1)
                                const height = (item.count / max) * 100
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition cursor-pointer"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                            title={`${formatDate(item.date)}: ${item.count} new communities`}
                                        />
                                        <span className="text-[8px] text-gray-400 mt-1 rotate-45 origin-left">
                                            {formatDate(item.date)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}