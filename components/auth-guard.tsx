"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let ignore = false

    const check = async () => {
      // Allow sign-in page without auth
      if (pathname?.startsWith("/sign-in")) {
        setAuthed(false)
        setChecking(false)
        return
      }

      if (!hasSupabaseEnv || !supabase) {
        // If Supabase isn't configured, skip gating so the app still works
        setAuthed(true)
        setChecking(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      const loggedIn = Boolean(data.session)
      if (!ignore) {
        setAuthed(loggedIn)
        setChecking(false)
        if (!loggedIn) router.replace("/sign-in")
      }
    }

    check()

    const upsertProfile = async (session: Session) => {
      try {
        if (!hasSupabaseEnv || !supabase) return
        const user = session.user
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          last_sign_in_at: new Date().toISOString(),
        } as any)
      } catch (e) {
        // ignore if table doesn't exist yet
      }
    }

    const { data: sub } = supabase?.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setAuthed(Boolean(session))
      if (!session && !pathname?.startsWith("/sign-in")) {
        router.replace("/sign-in")
      } else if (session && pathname?.startsWith("/sign-in")) {
        await upsertProfile(session)
        router.replace("/")
      }
    }) ?? { data: { subscription: { unsubscribe: () => {} } } } as any

    return () => {
      ignore = true
      sub.subscription?.unsubscribe?.()
    }
  }, [pathname, router])

  if (pathname?.startsWith("/sign-in")) {
    // don't gate sign-in page
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking authentication...
      </div>
    )
  }

  if (!authed) {
    return null
  }

  return <>{children}</>
}
