import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/listings'

export interface AppUser {
  id: string
  email: string
  fullName: string
  phone: string
  avatarUrl: string | null
  role: UserRole
}

interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<AppUser | null>
  signUp: (data: { email: string; password: string; fullName: string; role: UserRole }) => Promise<AppUser | null>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function buildAppUser(authUser: SupabaseUser): Promise<AppUser> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', authUser.id)
    .maybeSingle()

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    fullName: profile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'RentaKasi user',
    phone: profile?.phone || '',
    avatarUrl: profile?.avatar_url || null,
    role: (authUser.user_metadata?.role as UserRole) || 'tenant',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const hydrateUser = async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null)
      return
    }
    setUser(await buildAppUser(authUser))
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await hydrateUser(data.session?.user ?? null)
      if (mounted) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      hydrateUser(nextSession?.user ?? null).finally(() => setLoading(false))
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const nextUser = data.user ? await buildAppUser(data.user) : null
    setSession(data.session)
    setUser(nextUser)
    return nextUser
  }

  const signUp = async (data: { email: string; password: string; fullName: string; role: UserRole }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
        },
      },
    })

    if (error) throw error
    if (!authData.user) return null

    if (authData.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: data.fullName,
      })

      if (profileError) throw profileError
    }

    const nextUser = await buildAppUser(authData.user)
    setSession(authData.session)
    setUser(nextUser)
    return nextUser
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    await hydrateUser(session?.user ?? null)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated: !!session && !!user,
      signIn,
      signUp,
      logout,
      refreshProfile,
    }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
