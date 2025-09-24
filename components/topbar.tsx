"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserInfo {
  id: string
  email: string | null
}

export default function TopBar() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!hasSupabaseEnv || !supabase) return
      const { data } = await supabase.auth.getUser()
      if (mounted) {
        setUser(data.user ? { id: data.user.id, email: data.user.email } : null)
      }
    }
    load()
    const { data: sub } = supabase?.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ? { id: s.user.id, email: s.user.email } : null)
    }) ?? { data: { subscription: { unsubscribe: () => {} } } } as any

    return () => {
      mounted = false
      sub.subscription?.unsubscribe?.()
    }
  }, [pathname])

  const logout = async () => {
    if (!hasSupabaseEnv || !supabase) return
    await supabase.auth.signOut()
    router.replace("/sign-in")
  }

  return (
    <div className="fixed top-0 right-0 left-64 h-16 border-b border-sidebar-border bg-background/80 backdrop-blur z-30 flex items-center justify-end gap-3 px-6">
      {user ? (
        <>
          <Button variant="outline" onClick={logout} className="hidden sm:flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={""} alt={user.email || "User"} />
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm text-foreground">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/my-gallery">My Gallery</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/analytics">Analytics</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Button variant="outline" onClick={() => router.push("/sign-in")}>Sign in</Button>
      )}
    </div>
  )
}
