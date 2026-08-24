import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-500">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    if (!isAdmin) {
        return <Navigate to="/" />
    }

    return children
}