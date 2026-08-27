 import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { 
  Menu, 
  X, 
  Home, 
  Rss, 
  Calendar, 
  Trophy, 
  Building2, 
  ClipboardList,
  Shield,
  Settings,
  LogOut,
  Bell,
  User,
  Search,
  MessageCircle,
  ChevronDown
} from 'lucide-react'

export default function TopNav() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const menuRef = useRef(null)
  const searchRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setShowSearch(false)
  }, [location.pathname])

  // Get unread notifications count
  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)

        if (error) {
          console.warn('Error fetching unread count:', error)
          setUnreadCount(0)
          return
        }
        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        setUnreadCount(0)
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .ilike('username', `%${searchQuery}%`)
          .limit(5)

        if (error) {
          console.warn('Search error:', error)
          setSearchResults([])
          return
        }
        setSearchResults(data || [])
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setIsMenuOpen(false)
  }

  // ✅ Navigation items - Desktop Top Nav
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/feed', icon: Rss, label: 'Feed' },
    { path: '/matches', icon: Calendar, label: 'Matches' },
    { path: '/leaderboard', icon: Trophy, label: 'Premium Predictions' },
    { path: '/community', icon: Building2, label: 'Community' },
    { path: '/slip', icon: ClipboardList, label: 'Slip' },
  ]

  // Admin items
  const adminItems = [
    { path: '/admin', icon: Shield, label: 'Admin Dashboard' },
  ]

  // ✅ CORRECTED BOTTOM NAV - Mobile
  const bottomNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/feed', icon: Rss, label: 'Feed' },
    { path: '/inbox', icon: MessageCircle, label: 'Inbox' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },  // ← Settings RESTORED
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleSearchSelect = (userId) => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
    navigate(`/profile/${userId}`)
  }

  return (
    <>
      {/* ===== TOP NAV BAR ===== */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition md:hidden"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} className="text-gray-700 dark:text-gray-300" /> : <Menu size={24} className="text-gray-700 dark:text-gray-300" />}
              </button>

              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-800 dark:text-white">
                  PredictFC
                </span>
              </Link>
            </div>

            {/* Center: Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive(item.path)
                      ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}
            </div>

            {/* Right: Search + Notifications + Profile */}
            <div className="flex items-center gap-2">
              {/* Search - Desktop */}
              <div className="hidden md:block relative" ref={searchRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearch(true)
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Search users..."
                    className="w-48 lg:w-64 px-4 py-1.5 pl-9 pr-4 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchSelect(result.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 last:border-0 text-left"
                      >
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {result.avatar_url ? (
                            <img src={result.avatar_url} alt={result.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                              {result.username?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white text-sm">
                            {result.full_name || result.username}
                            {result.is_verified && (
                              <span className="ml-1 text-blue-500">✓</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">@{result.username}</p>
                        </div>
                        <ChevronDown size={14} className="ml-auto text-gray-400 rotate-[-90deg]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search - Mobile (icon only) */}
              <button
                onClick={() => navigate('/search')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition md:hidden"
                aria-label="Search"
              >
                <Search size={20} className="text-gray-600 dark:text-gray-300" />
              </button>

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Avatar */}
              <Link
                to="/profile"
                className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 transition flex-shrink-0"
                aria-label="Profile"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== MOBILE HAMBURGER MENU ===== */}
      {isMenuOpen && (
        <div
          className="fixed inset-x-0 top-14 bottom-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            ref={menuRef}
            className="w-72 h-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">
                    {profile?.full_name || profile?.username || 'User'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 truncate">@{profile?.username || 'user'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive(item.path)
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </>
              )}

              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

              {/* Settings */}
              <Link
                to="/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Settings size={20} />
                <span className="font-medium">Settings</span>
              </Link>

              {/* Inbox */}
              <Link
                to="/inbox"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <MessageCircle size={20} />
                <span className="font-medium">Inbox</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* App Version */}
            <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700">
              PredictFC v1.0.0
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition touch-target ${
                  active
                    ? 'text-gray-800 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <item.icon
                  size={22}
                  className={active ? 'text-gray-800 dark:text-white' : ''}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}