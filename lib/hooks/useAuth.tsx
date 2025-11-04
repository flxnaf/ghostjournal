'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { createClient } from '../supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Supabase Auth Hook
 * 
 * Replaces the temporary localStorage auth with Supabase authentication.
 * 
 * Data structure stored in Supabase:
 * - User profile (email, name, id)
 * - Voice clone data (voiceModelId)
 * - Face data (faceContours)
 * - Personality context (stories, habits, reactions)
 * - Chat history (summarized for context)
 * - Memories (vector embeddings)
 */

interface User {
  id: string
  email: string
  name?: string
  username?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Helper function to convert Supabase user to our User interface
  const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
    username: supabaseUser.user_metadata?.username,
    createdAt: supabaseUser.created_at
  })

  // Fetch username from database (source of truth)
  const fetchUserProfile = async (userId: string): Promise<string | undefined> => {
    try {
      const response = await fetch(`/api/personality?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Fetched username from database:', data.username)
        return data.username
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch username from database:', error)
    }
    return undefined
  }

  // Check for existing session on mount
  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'https://placeholder.supabase.co' || 
        supabaseKey === 'placeholder-key') {
      console.error('❌ Supabase not configured. Please set environment variables in Railway.')
      setIsLoading(false)
      return
    }
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else if (session?.user) {
          const user = convertSupabaseUser(session.user)
          // Fetch username from database (source of truth)
          const dbUsername = await fetchUserProfile(session.user.id)
          if (dbUsername) {
            user.username = dbUsername
          }
          setUser(user)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = convertSupabaseUser(session.user)
          // Fetch username from database (source of truth)
          const dbUsername = await fetchUserProfile(session.user.id)
          if (dbUsername) {
            user.username = dbUsername
          }
          setUser(user)
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signup = async (email: string, password: string, name?: string) => {
    // name is the username
    const username = name
    
    console.log('🔐 Attempting signup:', { email, username })
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password,
      options: {
        data: {
          username: username,
          name: username
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('❌ Signup error:', error)
      throw new Error(error.message)
    }

    console.log('✅ Signup response:', { 
      user: data.user?.id, 
      session: data.session ? 'exists' : 'null',
      emailConfirmationSent: !data.session && data.user ? 'yes' : 'no'
    })

    // If email confirmation is required, redirect to confirmation page
    if (data.user && !data.session) {
      console.log('📧 Email confirmation required - redirecting...')
      const confirmUrl = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`
      window.location.href = confirmUrl
      return
    }

    // If session exists (email confirmation disabled), set user immediately
    if (data.user && data.session) {
      const user = convertSupabaseUser(data.user)
      user.username = username
      setUser(user)
      console.log('✅ User set in state:', user.id)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      setUser(convertSupabaseUser(data.user))
    }
  }

  const loginWithGoogle = async () => {
    console.log('🔐 Attempting Google sign-in')

    // Use environment variable for OAuth redirect, fallback to current origin
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    const redirectUrl = `${baseUrl}/auth/callback`
    console.log('📍 Redirect URL:', redirectUrl)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      console.error('❌ Google sign-in error:', error)
      throw new Error(error.message)
    }

    console.log('✅ Redirecting to Google...')
    // User will be redirected to Google, then back to /auth/callback
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
    }

    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

