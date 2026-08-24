 import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Bell, 
  User, 
  LogOut, 
  Home, 
  Rss, 
  Calendar, 
  Users, 
  Trophy, 
  Shield,
  Menu,
  X,
  Ticket
} from 'lucide-react'
import ProfilePicture from '../ProfilePicture'
import { getCachedSettings } from '../../services/settingsService'

export default function Navbar() {
    const { user, profile, signOut, isAdmin, isVerified } = useAuth()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    
    const settings = getCachedSettings()
    const appName = settings?.app_name || 'PredictFC'

    useEffect(() => {
        if (user) {
            const getUnreadCount = async () => {
                const { count, error } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('read', false)
                
                if (!error) {
                    setUnreadCount(count || 0)
                }
            }
            getUnreadCount()

            const subscription = supabase
                .channel('notifications-count')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        setUnreadCount(prev => prev + 1)
                    }
                )
                .subscribe()

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [user])

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false)
    }

    return (
        <nav className="bg-black text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2" onClick={handleLinkClick}>
                        <span className="font-bold text-xl">{appName}</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1">
                        <Link to="/" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Home size={18} /> Home
                        </Link>
                        <Link to="/feed" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Rss size={18} /> Feed
                        </Link>
                        <Link to="/matches" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Calendar size={18} /> Matches
                        </Link>
                        <Link to="/slip" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Ticket size={18} /> Slip
                        </Link>
                        <Link to="/community" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Users size={18} /> Community
                        </Link>
                        <Link to="/leaderboard" className="px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm text-white flex items-center gap-2">
                            <Trophy size={18} /> Leaderboard
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" className="px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition flex items-center gap-2">
                                <Shield size={18} /> Admin
                            </Link>
                        )}
                    </div>

                    <div className="hidden md:flex items-center space-x-3">
                        <Link to="/notifications" className="relative hover:bg-white/10 p-2 rounded-lg transition">
                            <Bell size={20} className="text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                            <ProfilePicture size="sm" />
                            <span className="text-sm font-medium text-white">
                                {profile?.username || user?.email?.split('@')[0] || 'User'}
                            </span>
                        </Link>
                        <button onClick={handleSignOut} className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition flex items-center gap-1">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition focus:outline-none text-white">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden pb-4 border-t border-white/10">
                        <div className="flex flex-col space-y-1 pt-2">
                            <Link to="/" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Home size={18} /> Home
                            </Link>
                            <Link to="/feed" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Rss size={18} /> Feed
                            </Link>
                            <Link to="/matches" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Calendar size={18} /> Matches
                            </Link>
                            <Link to="/slip" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Ticket size={18} /> Slip
                            </Link>
                            <Link to="/community" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Users size={18} /> Community
                            </Link>
                            <Link to="/leaderboard" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Trophy size={18} /> Leaderboard
                            </Link>
                            <Link to="/profile" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <User size={18} /> Profile
                            </Link>
                            <Link to="/notifications" className="px-3 py-2 rounded-lg hover:bg-white/10 transition flex items-center gap-2 text-white" onClick={handleLinkClick}>
                                <Bell size={18} /> Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className="px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition flex items-center gap-2" onClick={handleLinkClick}>
                                    <Shield size={18} /> Admin Panel
                                </Link>
                            )}
                            <button onClick={() => { handleLinkClick(); handleSignOut() }} className="px-3 py-2 text-left rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex items-center gap-2">
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}