import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isMaintenanceMode } from '../services/settingsService'
import MaintenanceMode from './MaintenanceMode'

export default function MaintenanceGuard({ children }) {
    const { user, isAdmin, loading } = useAuth()
    const [inMaintenance, setInMaintenance] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const mode = await isMaintenanceMode()
                setInMaintenance(mode)
            } catch (error) {
                console.error('Error checking maintenance mode:', error)
                setInMaintenance(false)
            } finally {
                setChecking(false)
            }
        }
        checkMaintenance()
    }, [])

    // Show loading while checking
    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
                <div className="text-xl text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        )
    }

    // If in maintenance mode and user is NOT admin, show maintenance page
    if (inMaintenance && !isAdmin) {
        return <MaintenanceMode />
    }

    // Otherwise, show children
    return children
}