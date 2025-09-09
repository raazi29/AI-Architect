"use client"

import type React from "react"
import { useEffect } from "react"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Wand2, Upload, Sparkles, Download, Share, Heart, RefreshCw, Video, Play } from "lucide-react"

export default function AIGenerator() {
  useEffect(() => {
    console.log("AI Generator page loaded successfully")
  }, [])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [roomType, setRoomType] = useState("")
  const [designStyle, setDesignStyle] = useState("")
  const [budget, setBudget] = useState("")
  const [preferences, setPreferences] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([])
  const [generationType, setGenerationType] = useState<"image" | "video">("image")
  const [videoStyle, setVideoStyle] = useState("")
  const [videoDuration, setVideoDuration] = useState("")
  const [progress, setProgress] = useState(0)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !roomType || !designStyle) {
      alert("Please fill in all required fields")
      return
    }

    if (generationType === "video" && (!videoStyle || !videoDuration)) {
      alert("Please fill in video-specific fields")
      return
    }

    setIsGenerating(true)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("roomType", roomType)
      formData.append("designStyle", designStyle)
      formData.append("budget", budget)
      formData.append("preferences", preferences)
      formData.append("generationType", generationType)
      if (generationType === "video") {
        formData.append("videoStyle", videoStyle)
        formData.append("videoDuration", videoDuration)
      }

      const response = await fetch("/api/generate-design", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (generationType === "image") {
          setGeneratedImages(data.images || [])
        } else {
          setGeneratedVideos(data.videos || [])
        }
        setProgress(100)
      }
    } catch (error) {
      console.error("Generation failed:", error)
      if (generationType === "image") {
        setGeneratedImages([
          "/modern-minimalist-living-room.jpg",
          "/scandinavian-bedroom-design.jpg",
          "/industrial-kitchen-design.jpg",
        ])
      } else {
        setGeneratedVideos([
          "/demo-room-transformation.mp4",
          "/demo-furniture-placement.mp4",
          "/demo-lighting-changes.mp4",
        ])
      }
      setProgress(100)
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">AI Interior Generator</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Upload a room photo and let AI transform it with professional interior design suggestions and dynamic
              video walkthroughs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload & Configure
                </CardTitle>
                <CardDescription>Provide your room details for AI-powered redesign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as "image" | "video")}>
                  <TabsList className="grid w-full grid-cols-2">
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

                <div>
                  <Label htmlFor="room-upload">Room Photo</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="room-upload"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="room-upload"
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block"
                    >
                      {selectedFile ? (
                        <div>
                          <Image
                            src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                            alt="Uploaded room"
                            width={500}
                            height={128}
                            className="w-full h-32 object-cover rounded-md mb-2"
                          />
                          <p className="text-sm text-foreground font-medium">{selectedFile.name}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop your room photo
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="room-type">Room Type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="design-style">Design Style</Label>
                  <Select value={designStyle} onValueChange={setDesignStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select design style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="scandinavian">Scandinavian</SelectItem>
                      <SelectItem value="bohemian">Bohemian</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generationType === "video" && (
                  <>
                    <div>
                      <Label htmlFor="video-style">Video Style</Label>
                      <Select value={videoStyle} onValueChange={setVideoStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select video style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walkthrough">Walkthrough</SelectItem>
                          <SelectItem value="fly-through">Fly-through</SelectItem>
                          <SelectItem value="time-lapse">Time-lapse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="video-duration">Video Duration</Label>
                      <Select value={videoDuration} onValueChange={setVideoDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select video duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15s">15 seconds</SelectItem>
                          <SelectItem value="30s">30 seconds</SelectItem>
                          <SelectItem value="60s">60 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preferences">Additional Preferences (Optional)</Label>
                  <Textarea
                    id="preferences"
                    placeholder="e.g., 'add a fireplace', 'use warm lighting', 'modern art on walls'"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                  />
                </div>

                <Button onClick={handleGenerate} className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate AI {generationType === "video" ? "Video" : "Design"}
                    </>
                  )}
                </Button>

                {isGenerating && <Progress value={progress} className="w-full mt-4" />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generated Designs
                </CardTitle>
                <CardDescription>View and manage your AI-generated interior designs</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 && generatedVideos.length === 0 && !isGenerating && (
                  <div className="text-center text-muted-foreground py-8">
                    Your generated designs will appear here.
                  </div>
                )}

                {generationType === "image" && generatedImages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={image}
                          alt={`Generated Design ${index + 1}`}
                          width={500}
                          height={192}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Button variant="secondary" size="icon" className="mr-2">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {generationType === "video" && generatedVideos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedVideos.map((video, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={video}
                          controls
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Button variant="secondary" size="icon" className="mr-2">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="icon">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate New
                  </Button>
                  <Button>
                    <Heart className="mr-2 h-4 w-4" />
                    Save to Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}