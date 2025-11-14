"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Lazy load heavy components for better performance
const ImageGenerator = dynamic(() => import("@/components/image-generator/ImageGenerator").then(mod => ({ default: mod.ImageGenerator })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
  ssr: false
})

import { Sparkles } from "lucide-react"

export default function AIGenerator() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">AI Interior Generator</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Upload a room photo and let AI transform it with professional interior design suggestions.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Image Generation
              </CardTitle>
              <CardDescription>Generate stunning interior design images from your room photos</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGenerator />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
