"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"

type Profile = {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
}

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .eq("id", user.id)
        .single()

      if (error) {
        setProfile(null)
      } else {
        setProfile(data as Profile)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    fetchProfile()
  }, [fetchProfile])

  const value: ProfileContextType = {
    profile,
    loading,
    refresh: fetchProfile,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider")
  return ctx
}