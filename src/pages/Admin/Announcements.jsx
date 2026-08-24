 import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { 
  Megaphone, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  AlertCircle,
  Bell,
  Info,
  AlertTriangle,
  X
} from 'lucide-react'

export default function Announcements() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [announcements, setAnnouncements] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({
        title: '',
        content: '',
        type: 'banner',
        target: 'all',
        target_community_id: '',
        start_date: '',
        end_date: '',
        active: true,
        priority: 'normal'
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadAnnouncements()
    }, [])

    const loadAnnouncements = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select(`
                    *,
                    profiles:created_by (id, username, full_name)
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.warn('Error loading announcements (table may not exist):', error)
                setAnnouncements([])
                setLoading(false)
                return
            }

            setAnnouncements(data || [])
        } catch (error) {
            console.error('Error loading announcements:', error)
            setAnnouncements([])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.title.trim() || !form.content.trim()) {
            showToast('Please fill in all required fields', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const announcementData = {
                title: form.title.trim(),
                content: form.content.trim(),
                type: form.type,
                target: form.target,
                target_community_id: form.target === 'community' && form.target_community_id ? form.target_community_id : null,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                active: form.active,
                priority: form.priority,
                created_by: user.id
            }

            let result
            if (editing) {
                const { data, error } = await supabase
                    .from('announcements')
                    .update({
                        ...announcementData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editing.id)
                    .select()
                    .single()

                if (error) throw error
                result = data
                showToast('Announcement updated successfully', 'success')
            } else {
                const { data, error } = await supabase
                    .from('announcements')
                    .insert(announcementData)
                    .select()
                    .single()

                if (error) throw error
                result = data
                showToast('Announcement created successfully', 'success')
            }

            setShowModal(false)
            setEditing(null)
            resetForm()
            await loadAnnouncements()
        } catch (error) {
            console.error('Error saving announcement:', error)
            showToast('Failed to save announcement: ' + error.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return

        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id)

            if (error) throw error
            showToast('Announcement deleted', 'success')
            await loadAnnouncements()
        } catch (error) {
            console.error('Error deleting announcement:', error)
            showToast('Failed to delete announcement', 'error')
        }
    }

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('announcements')
                .update({ 
                    active: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error
            showToast(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`, 'success')
            await loadAnnouncements()
        } catch (error) {
            console.error('Error toggling announcement:', error)
            showToast('Failed to update announcement', 'error')
        }
    }

    const resetForm = () => {
        setForm({
            title: '',
            content: '',
            type: 'banner',
            target: 'all',
            target_community_id: '',
            start_date: '',
            end_date: '',
            active: true,
            priority: 'normal'
        })
    }

    const openCreateModal = () => {
        resetForm()
        setEditing(null)
        setShowModal(true)
    }

    const openEditModal = (announcement) => {
        setEditing(announcement)
        setForm({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type || 'banner',
            target: announcement.target || 'all',
            target_community_id: announcement.target_community_id || '',
            start_date: announcement.start_date?.split('T')[0] || '',
            end_date: announcement.end_date?.split('T')[0] || '',
            active: announcement.active,
            priority: announcement.priority || 'normal'
        })
        setShowModal(true)
    }

    const getTypeBadge = (type) => {
        const types = {
            banner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            popup: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            notification: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        }
        return types[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }

    const getTypeIcon = (type) => {
        switch(type) {
            case 'banner':
                return Megaphone
            case 'popup':
                return AlertCircle
            case 'notification':
                return Bell
            default:
                return Megaphone
        }
    }

    const getStatusBadge = (active, startDate, endDate) => {
        if (!active) {
            return (
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <XCircle size={12} /> Inactive
                </span>
            )
        }
        if (startDate && new Date(startDate) > new Date()) {
            return (
                <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock size={12} /> Scheduled
                </span>
            )
        }
        if (endDate && new Date(endDate) < new Date()) {
            return (
                <span className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <XCircle size={12} /> Expired
                </span>
            )
        }
        return (
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} /> Active
            </span>
        )
    }

    const getPriorityBadge = (priority) => {
        switch(priority) {
            case 'high':
                return (
                    <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} /> High Priority
                    </span>
                )
            case 'normal':
                return (
                    <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full flex items-center gap-1">
                        <Info size={12} /> Normal
                    </span>
                )
            default:
                return (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                        <Info size={12} /> Low
                    </span>
                )
        }
    }

    const getTargetLabel = (target, communityId) => {
        switch(target) {
            case 'all': return 'All Users'
            case 'premium': return 'Premium Users'
            case 'free': return 'Free Users'
            case 'community': return `Community: ${communityId || 'Selected'}`
            default: return 'All Users'
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">Loading announcements...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Megaphone size={24} /> Announcements
                    </h1>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Create and manage platform-wide announcements</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gray-800 dark:bg-white text-white dark:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition flex items-center gap-2"
                >
                    <Plus size={18} /> New Announcement
                </button>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <Megaphone className="w-16 h-16 text-gray-200 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 dark:text-gray-500">No announcements yet</p>
                        <p className="text-sm text-gray-300 dark:text-gray-600">Create your first announcement to communicate with users</p>
                    </div>
                ) : (
                    announcements.map((announcement) => {
                        const TypeIcon = getTypeIcon(announcement.type)
                        
                        return (
                            <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getTypeBadge(announcement.type)}`}>
                                                <TypeIcon size={12} /> {announcement.type}
                                            </span>
                                            {getStatusBadge(announcement.active, announcement.start_date, announcement.end_date)}
                                            {getPriorityBadge(announcement.priority)}
                                        </div>
                                        <h3 className="font-bold text-gray-800 dark:text-white">{announcement.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{announcement.content}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Target size={12} /> {getTargetLabel(announcement.target, announcement.target_community_id)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> By {announcement.profiles?.username || 'Unknown'}
                                            </span>
                                            {announcement.start_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> Starts: {new Date(announcement.start_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            {announcement.end_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> Ends: {new Date(announcement.end_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleToggleActive(announcement.id, announcement.active)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            title={announcement.active ? 'Deactivate' : 'Activate'}
                                        >
                                            {announcement.active ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(announcement)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editing ? 'Edit Announcement' : 'Create Announcement'}
                            </h3>
                            <button 
                                onClick={() => {
                                    setShowModal(false)
                                    setEditing(null)
                                    resetForm()
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({...form, title: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                        placeholder="Enter announcement title"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                                    <textarea
                                        value={form.content}
                                        onChange={(e) => setForm({...form, content: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200 resize-none"
                                        rows="4"
                                        placeholder="Write your announcement content"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select
                                            value={form.type}
                                            onChange={(e) => setForm({...form, type: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                        >
                                            <option value="banner">Banner - Shows at top of Home page</option>
                                            <option value="popup">Popup - Shows as a modal overlay</option>
                                            <option value="notification">Notification - Small inline notification</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            value={form.priority}
                                            onChange={(e) => setForm({...form, priority: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                                    <select
                                        value={form.target}
                                        onChange={(e) => setForm({...form, target: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="premium">Premium Users Only</option>
                                        <option value="free">Free Users Only</option>
                                        <option value="community">Specific Community</option>
                                    </select>
                                </div>

                                {form.target === 'community' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Community ID</label>
                                        <input
                                            type="text"
                                            value={form.target_community_id}
                                            onChange={(e) => setForm({...form, target_community_id: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                            placeholder="Enter community ID"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={form.start_date}
                                            onChange={(e) => setForm({...form, start_date: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={form.end_date}
                                            onChange={(e) => setForm({...form, end_date: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={form.active}
                                        onChange={(e) => setForm({...form, active: e.target.checked})}
                                        className="w-5 h-5 accent-gray-800 dark:accent-gray-400"
                                    />
                                    <label className="text-sm text-gray-700 dark:text-gray-300">Active immediately</label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditing(null)
                                        resetForm()
                                    }}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-gray-800 dark:bg-white text-white dark:text-gray-800 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <Megaphone size={18} />}
                                    {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}