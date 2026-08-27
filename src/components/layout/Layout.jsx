 import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Top Navigation with integrated hamburger menu */}
      <TopNav />
      
      {/* Main Content - padding bottom for mobile bottom nav */}
      <main className="pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}