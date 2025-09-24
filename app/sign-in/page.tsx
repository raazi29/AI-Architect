"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Navigation } from "@/components/navigation"
import { supabase, hasSupabaseEnv } from "@/lib/supabaseClient"
import { LogIn, Mail, Lock, RefreshCw, Chrome } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const doEmailPassword = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!hasSupabaseEnv || !supabase) {
        setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        return
      }
      if (!email || !password) {
        setError("Please enter email and password")
        return
      }
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace("/")
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfoOpen(true)
      }
    } catch (e: any) {
      setError(e?.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const doGoogle = async () => {
    try {
      if (!hasSupabaseEnv || !supabase) {
        setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        return
      }
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } })
      if (error) throw error
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="ml-64 p-8">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Welcome</h1>
            </div>
            <p className="text-muted-foreground">Sign in to continue using AI Architect</p>
          </div>

          {!hasSupabaseEnv && (
            <div className="text-sm text-red-500 mb-4">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Use email/password or continue with Google</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                {error && <div className="text-sm text-red-500">{error}</div>}
                <Button className="w-full" onClick={doEmailPassword} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {tab === "signin" ? "Sign In" : "Create Account"}
                    </>
                  )}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={doGoogle} disabled={loading}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Info dialog for sign-up */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            We sent you a confirmation link. Please verify your email, then return to sign in.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
