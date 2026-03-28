import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import type { Profile, UserRole } from "@/shared/types/auth"
import { fetchProfile, signInWithEmail, signUpWithEmail } from "@/features/auth/services/authService"
import { supabase } from "@/shared/services/supabaseClient"

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<Session | null>
  signUp: (params: {
    email: string
    password: string
    fullName?: string
    role?: UserRole
    documento?: string
    tipo_documento?: "cpf" | "cnpj"
    telefone?: string
  }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error) {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      }
      setLoading(false)
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Load profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    let isMounted = true
    const loadProfile = async () => {
      const data = await fetchProfile(user.id)
      if (isMounted) setProfile(data)
    }
    loadProfile()
    return () => {
      isMounted = false
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn: async (email, password) => {
        const { session } = await signInWithEmail(email, password)
        return session ?? null
      },
      signUp: async ({ email, password, fullName, role, documento, tipo_documento, telefone }) => {
        await signUpWithEmail({ email, password, fullName, role, documento, tipo_documento, telefone })
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
      },
    }),
    [session, user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider")
  return ctx
}
