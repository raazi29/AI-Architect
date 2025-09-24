"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

export type GenImage = { id?: string; url: string; storage_path?: string }

interface SessionStoreValue {
  // AI Generator form/state
  selectedFile: File | null
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>
  roomType: string
  setRoomType: React.Dispatch<React.SetStateAction<string>>
  designStyle: string
  setDesignStyle: React.Dispatch<React.SetStateAction<string>>
  budget: string
  setBudget: React.Dispatch<React.SetStateAction<string>>
  preferences: string
  setPreferences: React.Dispatch<React.SetStateAction<string>>
  promptText: string
  setPromptText: React.Dispatch<React.SetStateAction<string>>
  promptHistory: string[]
  setPromptHistory: React.Dispatch<React.SetStateAction<string[]>>
  imagesCount: 1 | 2 | 3 | 4
  setImagesCount: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>
  generatedImages: GenImage[]
  setGeneratedImages: React.Dispatch<React.SetStateAction<GenImage[]>>
}

const SessionStoreContext = createContext<SessionStoreValue | null>(null)

export function SessionStoreProvider({ children }: { children: React.ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [roomType, setRoomType] = useState("")
  const [designStyle, setDesignStyle] = useState("")
  const [budget, setBudget] = useState("")
  const [preferences, setPreferences] = useState("")
  const [promptText, setPromptText] = useState("")
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [imagesCount, setImagesCount] = useState<1 | 2 | 3 | 4>(4)
  const [generatedImages, setGeneratedImages] = useState<GenImage[]>([])

  const value = useMemo(
    () => ({
      selectedFile, setSelectedFile,
      roomType, setRoomType,
      designStyle, setDesignStyle,
      budget, setBudget,
      preferences, setPreferences,
      promptText, setPromptText,
      promptHistory, setPromptHistory,
      imagesCount, setImagesCount,
      generatedImages, setGeneratedImages,
    }),
    [selectedFile, roomType, designStyle, budget, preferences, promptText, promptHistory, imagesCount, generatedImages]
  )

  return <SessionStoreContext.Provider value={value}>{children}</SessionStoreContext.Provider>
}

export function useSessionStore() {
  const ctx = useContext(SessionStoreContext)
  if (!ctx) throw new Error("useSessionStore must be used inside SessionStoreProvider")
  return ctx
}
