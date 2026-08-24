 import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TranslationProvider } from './contexts/TranslationContext'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ResetPassword from './components/auth/ResetPassword'
import Layout from './components/layout/Layout'
import MaintenanceGuard from './components/MaintenanceGuard'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Inbox from './pages/Inbox'
import Settings from './pages/Settings'
import Feed from './pages/Feed'
import Leaderboard from './pages/Leaderboard'
import Matches from './pages/Matches'
import Community from './pages/Community'
import Slip from './pages/Slip'
import CommunityDetail from './pages/CommunityDetail'
import CreateCommunity from './pages/CreateCommunity'
import Followers from './pages/Followers'
import Notifications from './pages/Notifications'
import Appearance from './pages/Appearance'
import Language from './pages/Language'
import AdminDashboard from './pages/Admin/Dashboard'
import Subscribe from './pages/Subscribe'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import { getCachedSettings } from './services/settingsService'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-xl text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }
  
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/subscribe" element={<Subscribe />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <MaintenanceGuard>
            <Layout />
          </MaintenanceGuard>
        </PrivateRoute>
      }>
        <Route index element={<Home />} />
        <Route path="feed" element={<Feed />} />
        <Route path="matches" element={<Matches />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="community" element={<Community />} />
        <Route path="community/:id" element={<CommunityDetail />} />
        <Route path="community/create" element={<CreateCommunity />} />
        <Route path="slip" element={<Slip />} />
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:userId/followers" element={<Followers />} />
        <Route path="profile/:userId/following" element={<Followers />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/appearance" element={<Appearance />} />
        <Route path="settings/language" element={<Language />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  // Request push notification permission only if enabled
  useEffect(() => {
    const settings = getCachedSettings()
    if (settings?.push_notifications_enabled !== false) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <TranslationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TranslationProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App