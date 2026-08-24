 import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [role, setRole] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isBanned, setIsBanned] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user)
                fetchProfile(session.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setUser(session.user)
                    await fetchProfile(session.user.id)
                } else {
                    setUser(null)
                    setProfile(null)
                    setRole(null)
                    setIsAdmin(false)
                    setIsBanned(false)
                    setIsVerified(false)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            if (data) {
                setProfile(data)
                setRole(data.role || 'user')
                setIsAdmin(data.role === 'admin')
                setIsBanned(data.is_banned || false)
                setIsVerified(data.is_verified || false)
                
                // If user is banned, sign them out
                if (data.is_banned) {
                    await supabase.auth.signOut()
                    setUser(null)
                    setProfile(null)
                    setRole(null)
                    setIsAdmin(false)
                    setIsBanned(false)
                    setIsVerified(false)
                    window.location.href = '/login?banned=true'
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    // ✅ SIGN UP with email normalization + duplicate detection
    const signUp = async (email, password, username, fullName, phone) => {
        try {
            // Normalize email: lowercase + trim
            const normalizedEmail = email.toLowerCase().trim()

            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    data: { 
                        username, 
                        full_name: fullName,
                        phone: phone
                    }
                }
            })
            if (error) throw error
            
            if (data.user) {
                // Update profile with normalized email and other fields
                await supabase
                    .from('profiles')
                    .update({ 
                        phone: phone,
                        full_name: fullName,
                        username: username,
                        email: normalizedEmail
                    })
                    .eq('id', data.user.id)
            }
            
            return data
        } catch (error) {
            console.error('Sign up error:', error)
            throw error
        }
    }

    // ✅ SIGN IN with email normalization
    const signIn = async (email, password) => {
        try {
            // Normalize email: lowercase + trim
            const normalizedEmail = email.toLowerCase().trim()

            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password
            })
            if (error) throw error
            
            await fetchProfile(data.user.id)
            return data
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setRole(null)
            setIsAdmin(false)
            setIsBanned(false)
            setIsVerified(false)
            setUser(null)
            setProfile(null)
        } catch (error) {
            console.error('Sign out error:', error)
            throw error
        }
    }

    const updateAvatar = async (avatarUrl) => {
        if (!user) {
            console.error('No user logged in')
            return null
        }
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id)
                .select()
                .single()
            
            if (error) {
                console.error('Update avatar error:', error)
                throw error
            }
            
            console.log('Avatar updated successfully:', data)
            setProfile(data)
            return data
        } catch (error) {
            console.error('Error updating avatar:', error)
            return null
        }
    }

    const updateProfile = async (updates) => {
        if (!user) return null
        
        // Remove email from updates if present (email is managed by auth)
        const { email, ...safeUpdates } = updates
        
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(safeUpdates)
                .eq('id', user.id)
                .select()
                .single()
            
            if (error) throw error
            
            setProfile(data)
            return data
        } catch (error) {
            console.error('Error updating profile:', error)
            return null
        }
    }

    const refreshProfile = () => {
        if (user?.id) {
            fetchProfile(user.id)
        }
    }

    const value = {
        user,
        profile,
        role,
        isAdmin,
        isBanned,
        isVerified,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateAvatar,
        updateProfile,
        fetchProfile
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}