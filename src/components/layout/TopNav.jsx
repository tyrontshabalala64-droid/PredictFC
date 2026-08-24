 import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Rss, 
  Trophy, 
  Calendar, 
  Building2, 
  ShoppingBag,
  Shield,
  Sparkles
} from 'lucide-react'

export default function TopNav() {
    const location = useLocation()
    const { isAdmin } = useAuth()
    
    const tabs = useMemo(() => {
        const baseTabs = [
            { icon: Rss, label: 'Feed', path: '/feed' },
            { icon: Calendar, label: 'Matches', path: '/matches' },
            { icon: Sparkles, label: 'Premium Predictions', path: '/leaderboard' }, // ✅ Renamed
            { icon: Building2, label: 'Community', path: '/community' },
            { icon: ShoppingBag, label: 'Slip', path: '/slip' },
        ]

        if (isAdmin) {
            baseTabs.push({ icon: Shield, label: 'Admin', path: '/admin' })
        }

        return baseTabs
    }, [isAdmin])

    const isActive = useMemo(() => {
        return (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    }, [location.pathname])

    const prefetchTab = (path) => {
        if (path === '/feed') {
            import('../../pages/Feed').catch(() => {})
        } else if (path === '/matches') {
            import('../../pages/Matches').catch(() => {})
        } else if (path === '/leaderboard') {
            import('../../pages/Leaderboard').catch(() => {})
        }
    }

    return (
        <div className="bg-black dark:bg-white border-b border-gray-800 dark:border-gray-200 sticky top-0 z-40 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const active = isActive(tab.path)
                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                onMouseEnter={() => prefetchTab(tab.path)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                                    active 
                                        ? 'bg-white dark:bg-black text-black dark:text-white' 
                                        : 'text-gray-300 dark:text-gray-600 hover:bg-gray-800 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}