"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { API_BASE_URL } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  Search,
  Home,
  Building,
  Castle,
  Briefcase,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  Square,
  Ruler,
  MapPin,
  Download,
  Settings
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  floorPlanTemplates,
  type FloorPlanTemplate,
  getCategories,
  getSubcategories,
  getTemplatesByCategory,
  searchTemplates
} from "./floor_plan_templates"

type ViewMode = "grid" | "list"
type FilterCategory = string | "all"

export default function FloorPlanGenerator() {
  const [prompt, setPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("default")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all")
  const [selectedDimension, setSelectedDimension] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const categories = getCategories()
  const availableSubcategories = selectedCategory === "all"
    ? []
    : getSubcategories(selectedCategory)

  const filteredTemplates = useMemo(() => {
    let filtered = floorPlanTemplates

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by subcategory
    if (selectedSubcategory !== "all") {
      filtered = filtered.filter(t => t.subcategory === selectedSubcategory)
    }

    // Filter by dimension
    if (selectedDimension !== "all") {
      filtered = filtered.filter(t => t.dimensions.includes(selectedDimension))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchTemplates(searchQuery)
    }

    return filtered
  }, [selectedCategory, selectedSubcategory, selectedDimension, searchQuery])

  const generateFloorPlan = async () => {
    if (!prompt) return

    setIsLoading(true)
    setGeneratedImage("")

    // Create an AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000) // 90 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/floor-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model: selectedModel }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        let errorMessage = "Failed to generate floor plan"

        try {
          const errorJson = JSON.parse(errorData)
          if (errorJson.detail) {
            errorMessage = errorJson.detail
          }
        } catch {
          if (errorData) {
            errorMessage = errorData
          }
        }

        throw new Error(errorMessage)
      }

      const imageBlob = await response.blob()
      const imageUrl = URL.createObjectURL(imageBlob)
      setGeneratedImage(imageUrl)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("Floor plan generation error:", error)

      let errorMessage = "Failed to generate floor plan"
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. The model may be loading or temporarily unavailable. Please try again in a few minutes."
        } else {
          errorMessage = error.message
        }
      }

      alert(errorMessage)

      // If the API token is not set, provide helpful guidance
      if (errorMessage.includes("HUGGING_FACE_API_TOKEN")) {
        alert("Please set up your HUGGING_FACE_API_TOKEN environment variable in the backend .env file")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectTemplate = (template: FloorPlanTemplate) => {
    setPrompt(template.prompt)
  }

  const clearFilters = () => {
    setSelectedCategory("all")
    setSelectedSubcategory("all")
    setSelectedDimension("all")
    setSearchQuery("")
  }

  const getDimensionColor = (dimensions: string) => {
    if (dimensions.includes("Small")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (dimensions.includes("Medium")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    if (dimensions.includes("Large")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (dimensions.includes("Extra Large")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      "Apartments": <Home className="h-4 w-4" />,
      "Houses": <Building className="h-4 w-4" />,
      "Villas": <Castle className="h-4 w-4" />,
      "Commercial": <Briefcase className="h-4 w-4" />,
      "Specialty": <Sparkles className="h-4 w-4" />,
    }
    return icons[category] || <Home className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      <main className="ml-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI Floor Plan Generator
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create stunning floor plans with AI. Choose from our extensive template library or describe your vision.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Generator and Results */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      Generate Your Floor Plan
                    </CardTitle>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generator Settings</DialogTitle>
                          <DialogDescription>
                            Configure your floor plan generation settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="model" className="text-sm font-medium">
                              AI Model
                            </Label>
                            <Select 
                              value={selectedModel} 
                              onValueChange={setSelectedModel}
                            >
                              <SelectTrigger className="bg-muted/50 border-0">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default (naver/sdxl-floorplan)</SelectItem>
                                <SelectItem value="stability">Stable Diffusion XL</SelectItem>
                                <SelectItem value="floorplan-sdxl">Floorplan SDXL v1</SelectItem>
                                <SelectItem value="maria26">Maria26 Floor Plan LoRA</SelectItem>
                                <SelectItem value="envy">Envy Floorplans XL</SelectItem>
                                <SelectItem value="lora4iabd">Lora4IABD Floor Plans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <CardDescription>
                    Describe your ideal space or use one of our professional templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., A modern two-bedroom apartment with an open-concept kitchen, a large living room, and a balcony overlooking the city..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={5}
                      className="resize-none border-0 bg-muted/50 focus-visible:ring-2"
                    />
                  </div>

                  <Button
                    onClick={generateFloorPlan}
                    disabled={isLoading || !prompt}
                    className="w-full py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Generate Floor Plan
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Result */}
              {generatedImage && (
                <Card className="shadow-md border-0 bg-card/50 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1 rounded-lg bg-green-500/10">
                          <Sparkles className="h-4 w-4 text-green-500" />
                        </div>
                        Generated Floor Plan
                      </CardTitle>
                      <Button variant="outline" size="sm" className="h-8" asChild>
                        <a href={generatedImage} download="floor-plan.png">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="relative group">
                      <img
                        src={generatedImage}
                        alt="Generated Floor Plan"
                        className="w-full h-auto rounded-md border shadow-sm group-hover:shadow-md transition-shadow"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/3 rounded-md transition-colors pointer-events-none" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Templates Section */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-blue-500/10">
                          <Grid3X3 className="h-5 w-5 text-blue-500" />
                        </div>
                        Template Library
                      </CardTitle>
                      <CardDescription>
                        Choose from {floorPlanTemplates.length} professional templates
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Category Tabs */}
                  <Tabs defaultValue="all" className="w-full mb-6" onValueChange={setSelectedCategory}>
                    <TabsList className="grid w-full grid-cols-6">
                      <TabsTrigger value="all" className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        All
                      </TabsTrigger>
                      <TabsTrigger value="Apartments" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Apartments
                      </TabsTrigger>
                      <TabsTrigger value="Houses" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Houses
                      </TabsTrigger>
                      <TabsTrigger value="Villas" className="flex items-center gap-2">
                        <Castle className="h-4 w-4" />
                        Villas
                      </TabsTrigger>
                      <TabsTrigger value="Commercial" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Commercial
                      </TabsTrigger>
                      <TabsTrigger value="Specialty" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Specialty
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-32 text-sm border-0 bg-background"
                      />
                    </div>

                    <Separator orientation="vertical" className="h-5" />

                    {selectedCategory !== "all" && (
                      <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                        <SelectTrigger className="w-32 text-sm border-0 bg-background">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {availableSubcategories.map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                      <SelectTrigger className="w-24 text-sm border-0 bg-background">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        <SelectItem value="Small">Small</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Large">Large</SelectItem>
                        <SelectItem value="Extra Large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                      <Filter className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredTemplates.length} of {floorPlanTemplates.length} templates
                    </p>
                    {filteredTemplates.length !== floorPlanTemplates.length && (
                      <Badge variant="secondary" className="text-xs">
                        Filtered
                      </Badge>
                    )}
                  </div>

                  {/* Templates Grid/List */}
                  <div className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto"
                      : "space-y-2 max-h-96 overflow-y-auto"
                  }>
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-0 bg-background/50 ${
                            viewMode === "list" ? "flex flex-row" : ""
                          }`}
                          onClick={() => selectTemplate(template)}
                        >
                          <CardHeader className={`pb-2 ${viewMode === "list" ? "flex-1" : ""}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-xl">{template.icon}</div>
                                <div className="flex-1">
                                  <CardTitle className="text-base mb-0.5">{template.name}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {template.description}
                                  </CardDescription>
                                </div>
                              </div>
                              {viewMode === "grid" && (
                                <div className="text-right">
                                  <Badge className={`${getDimensionColor(template.dimensions)} text-xs px-1.5 py-0.5`} variant="secondary">
                                    {template.dimensions.split(" ")[0]}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          {viewMode === "list" && (
                            <CardContent className="pb-2 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                  {template.features.slice(0, 2).map((feature) => (
                                    <Badge key={feature} variant="outline" className="text-xs px-1.5 py-0.5">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Ruler className="h-3 w-3" />
                                  {template.estimatedSize}
                                </div>
                              </div>
                            </CardContent>
                          )}

                          {viewMode === "grid" && (
                            <CardContent className="pb-2 pt-0">
                              <div className="flex flex-wrap gap-1 mb-2">
                                {template.features.slice(0, 2).map((feature) => (
                                  <Badge key={feature} variant="outline" className="text-xs px-1.5 py-0.5">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {template.subcategory}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Ruler className="h-3 w-3" />
                                  {template.estimatedSize}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <h3 className="text-base font-medium mb-1">No templates found</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          Try adjusting your search criteria or browse all templates.
                        </p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Show All Templates
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}