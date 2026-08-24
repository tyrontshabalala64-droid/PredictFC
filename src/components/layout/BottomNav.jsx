 import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Bell, MessageCircle, User, Settings as SettingsIcon } from 'lucide-react'

export default function BottomNav() {
    const location = useLocation()
    
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Bell, label: 'Notifications', path: '/notifications', className: 'tour-notifications-bottom' },
        { icon: MessageCircle, label: 'Inbox', path: '/inbox', className: 'tour-inbox-bottom' },
        { icon: User, label: 'Profile', path: '/profile', className: 'tour-profile-bottom' },
        { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 py-1 z-50 transition-colors duration-200">
            <div className="max-w-md mx-auto flex justify-around items-center">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${item.className || ''} flex flex-col items-center py-1 px-3 transition-colors relative ${
                                active ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            <Icon 
                                size={24} 
                                className={active ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                            {active && (
                                <span className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-800 dark:bg-white rounded-full" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}