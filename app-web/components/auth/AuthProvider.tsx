'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{error?: AuthError}>
  signOut: () => Promise<{error?: AuthError}>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      checkAdminRole(session?.user)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        checkAdminRole(session?.user)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAdminRole = (user: User | null) => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    // Verificar si el usuario es admin basado en metadata o email
    const userMetadata = user.user_metadata || {}
    const isAdminUser = 
      userMetadata.role === 'admin' ||
      userMetadata.role === 'comedor_admin' ||
      user.email === 'admin@sistema-comedor.local' ||
      user.email?.includes('@admin.') ||
      false // Por defecto false para seguridad

    setIsAdmin(isAdminUser)
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error || undefined }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error: error || undefined }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
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