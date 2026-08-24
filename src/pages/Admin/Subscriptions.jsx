import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function Subscriptions() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [subscriptions, setSubscriptions] = useState([])
    const [transactions, setTransactions] = useState([])
    const [stats, setStats] = useState({
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        platformFees: 0,
        creatorEarnings: 0
    })
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSubscription, setSelectedSubscription] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [filter])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load all subscription payments
            let query = supabase
                .from('subscription_payments')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, email),
                    communities:community_id (id, name, creator_id)
                `)
                .order('created_at', { ascending: false })

            if (filter === 'active') {
                query = query.eq('status', 'success')
            } else if (filter === 'pending') {
                query = query.eq('status', 'pending')
            } else if (filter === 'failed') {
                query = query.eq('status', 'failed')
            }

            const { data, error } = await query

            if (error) throw error
            setSubscriptions(data || [])

            // Calculate stats
            const active = data?.filter(s => s.status === 'success') || []
            const pending = data?.filter(s => s.status === 'pending') || []
            const failed = data?.filter(s => s.status === 'failed') || []
            const totalRevenue = active.reduce((sum, s) => sum + (s.amount || 0), 0)
            const platformFees = active.reduce((sum, s) => sum + (s.platform_fee || 0), 0)
            const creatorEarnings = active.reduce((sum, s) => sum + (s.creator_earnings || 0), 0)

            // Monthly revenue (last 30 days)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const monthly = active.filter(s => new Date(s.created_at) >= thirtyDaysAgo)
            const monthlyRevenue = monthly.reduce((sum, s) => sum + (s.amount || 0), 0)

            setStats({
                totalSubscriptions: data?.length || 0,
                activeSubscriptions: active.length,
                pendingSubscriptions: pending.length,
                failedSubscriptions: failed.length,
                totalRevenue: totalRevenue,
                monthlyRevenue: monthlyRevenue,
                platformFees: platformFees,
                creatorEarnings: creatorEarnings
            })

            // Load transactions
            const { data: txData } = await supabase
                .from('subscription_payments')
                .select(`
                    *,
                    profiles:user_id (id, username, full_name, email),
                    communities:community_id (id, name)
                `)
                .order('created_at', { ascending: false })
                .limit(50)

            setTransactions(txData || [])

        } catch (error) {
            console.error('Error loading subscriptions:', error)
            showToast('Failed to load subscription data', 'error')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        switch(status) {
            case 'success':
                return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle size={12} /> Active</span>
            case 'pending':
                return <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>
            case 'failed':
                return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><XCircle size={12} /> Failed</span>
            default:
                return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount || 0)
    }

    const filteredSubscriptions = searchQuery 
        ? subscriptions.filter(s => 
            s.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.communities?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : subscriptions

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">Loading subscription data...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard size={24} /> Subscriptions & Payments
                    </h1>
                    <p className="text-gray-400 text-sm">Manage and track all subscription payments</p>
                </div>
                <button
                    onClick={loadData}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm flex items-center gap-2"
                >
                    <Download size={16} /> Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign size={20} className="text-green-600" />
                        </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">+{formatCurrency(stats.monthlyRevenue)} this month</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.activeSubscriptions}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Total: {stats.totalSubscriptions}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Platform Fees</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.platformFees)}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <TrendingUp size={20} className="text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">50% of all payments</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Creator Earnings</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.creatorEarnings)}</p>
                        </div>
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <TrendingUp size={20} className="text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Paid to community creators</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('failed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Failed
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by user, email, or community..."
                    className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800"
                />
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Community</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSubscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                                        No subscriptions found
                                    </td>
                                </tr>
                            ) : (
                                filteredSubscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-800">{sub.profiles?.full_name || sub.profiles?.username || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400">{sub.profiles?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700">{sub.communities?.name || 'Unknown Community'}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-800">{formatCurrency(sub.amount)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(sub.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-500">{formatDate(sub.created_at)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedSubscription(sub)
                                                    setShowDetailModal(true)
                                                }}
                                                className="text-gray-400 hover:text-gray-600 transition"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedSubscription && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Subscription Details</h3>
                            <button 
                                onClick={() => {
                                    setShowDetailModal(false)
                                    setSelectedSubscription(null)
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">User</span>
                                    <span className="font-medium">{selectedSubscription.profiles?.full_name || selectedSubscription.profiles?.username}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Email</span>
                                    <span className="text-sm">{selectedSubscription.profiles?.email}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Community</span>
                                    <span className="font-medium">{selectedSubscription.communities?.name}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Amount</span>
                                    <span className="font-bold text-lg">{formatCurrency(selectedSubscription.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Platform Fee (50%)</span>
                                    <span>{formatCurrency(selectedSubscription.platform_fee)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Creator Earnings (50%)</span>
                                    <span className="text-green-600">{formatCurrency(selectedSubscription.creator_earnings)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Status</span>
                                    {getStatusBadge(selectedSubscription.status)}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-500">Date</span>
                                    <span className="text-sm">{formatDate(selectedSubscription.created_at)}</span>
                                </div>
                                {selectedSubscription.transaction_id && (
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-gray-500">Transaction ID</span>
                                        <span className="text-xs text-gray-400">{selectedSubscription.transaction_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowDetailModal(false)
                                setSelectedSubscription(null)
                            }}
                            className="w-full mt-4 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}