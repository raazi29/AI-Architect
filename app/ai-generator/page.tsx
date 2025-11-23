"use client"

import { Navigation } from "@/components/navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

// Lazy load heavy components for better performance
const ImageGenerator = dynamic(() => import("@/components/image-generator/ImageGenerator").then(mod => ({ default: mod.ImageGenerator })), {
  ssr: false
})

import { Sparkles } from "lucide-react"

export default function AIGenerator() {

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <MobileNavigation />

      <main className="p-4 pt-20 md:ml-64 md:p-8 md:pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-4xl font-bold">AI Interior Generator</h1>
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
