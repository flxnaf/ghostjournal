'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

/**
 * Temporary Auth Hook
 * 
 * This uses localStorage for now. Your friend can replace this with Supabase later.
 * 
 * Data structure to migrate to Supabase:
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
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('temp_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('temp_user')
      }
    }
    setIsLoading(false)
  }, [])

  const signup = async (email: string, password: string, name?: string) => {
    // TODO: Replace with Supabase signup
    // For now, just create a mock user and store in localStorage
    
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('temp_users') || '[]')
    const userExists = existingUsers.find((u: any) => u.email === email)
    
    if (userExists) {
      throw new Error('User already exists')
    }
    
    const newUser: User = {
      id: `temp_${Date.now()}`,
      email,
      name,
      createdAt: new Date().toISOString()
    }
    
    // Store password separately (insecure, just for demo)
    const userWithPassword = { ...newUser, password }
    existingUsers.push(userWithPassword)
    localStorage.setItem('temp_users', JSON.stringify(existingUsers))
    
    // Set current user
    localStorage.setItem('temp_user', JSON.stringify(newUser))
    setUser(newUser)
  }

  const login = async (email: string, password: string) => {
    // TODO: Replace with Supabase login
    const existingUsers = JSON.parse(localStorage.getItem('temp_users') || '[]')
    const foundUser = existingUsers.find((u: any) => u.email === email && u.password === password)
    
    if (!foundUser) {
      throw new Error('Invalid email or password')
    }
    
    const { password: _, ...userWithoutPassword } = foundUser
    localStorage.setItem('temp_user', JSON.stringify(userWithoutPassword))
    setUser(userWithoutPassword)
  }

  const logout = () => {
    localStorage.removeItem('temp_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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

