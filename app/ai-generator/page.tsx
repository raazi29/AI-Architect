"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageGenerator } from "@/components/image-generator/ImageGenerator"
import { VideoGenerator } from "@/components/image-generator/VideoGenerator"
import type { GeneratorMode } from "@/components/image-generator/types"
import { Sparkles, Video } from "lucide-react"

export default function AIGenerator() {
  const [generationType, setGenerationType] = useState<GeneratorMode>("image")

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">AI Interior Generator</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Upload a room photo and let AI transform it with professional interior design suggestions and dynamic
              video walkthroughs.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Design Generation
              </CardTitle>
              <CardDescription>Choose between image or video generation for your interior design</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as GeneratorMode)}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Image Generation
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Generation
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-6">
                {generationType === "image" ? <ImageGenerator /> : <VideoGenerator />}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
