"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrickWall, Search, Sparkles } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"

interface MaterialSuggestions {
  flooring: {
    primary_options: any[];
    alternative_options: any[];
  };
  walls: any;
  ceiling: any;
  fixtures: any;
  sustainability: any;
  indian_context: any;
  summary: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  retailer: string;
}

export default function AiMaterialsPage() {
  const [activeTab, setActiveTab] = useState("suggestions")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<MaterialSuggestions | null>(null)
  const [texture, setTexture] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState<number>(0)
  const [totalSteps, setTotalSteps] = useState<number>(0)

  // Add dark mode support to all components
  const cardClasses = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
  const textClasses = "text-gray-900 dark:text-gray-100"
  const mutedTextClasses = "text-gray-600 dark:text-gray-400"
  const buttonClasses = "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"

  // Form state
  const [roomType, setRoomType] = useState("")
  const [style, setStyle] = useState("")
  const [roomSize, setRoomSize] = useState("")
  const [durability, setDurability] = useState("")
  const [budget, setBudget] = useState("")
  const [specialRequirements, setSpecialRequirements] = useState("")
  const [textureDescription, setTextureDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const getMaterialSuggestions = async () => {
    if (!roomType || !style || !roomSize) {
      setError('Please fill in room type, style, and size')
      return
    }

    setLoading(true)
    setError(null)
    setSuggestions(null)

    try {
      const response = await fetch(`${API_BASE_URL}/materials/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `${roomType} ${style} materials`,
          room_type: roomType,
          style: style,
          budget_range: budget,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get material suggestions")
      }

      const data = await response.json()

      if (data.error) {
        setError(data.message || "Failed to get material suggestions")
        return
      }

      // Convert the response to the expected format
      const mockSuggestions: MaterialSuggestions = {
        flooring: {
          primary_options: data.products?.slice(0, 3).map((product: any) => ({
            material: product.name,
            description: product.brand,
            pros: ["Durable", "Cost-effective", "Easy to maintain"],
            cons: ["May require professional installation"],
            cost_range: `₹${product.price * 2}-${product.price * 4} per sq ft`
          })) || [],
          alternative_options: []
        },
        walls: {
          paint: {
            recommended_types: ["Emulsion paint", "Texture paint", "Wallpaper"]
          }
        },
        ceiling: {
          materials: ["POP ceiling", "Gypsum boards", "Wooden panels"]
        },
        fixtures: {},
        sustainability: {},
        indian_context: {},
        summary: `Based on your ${roomType} requirements with ${style} style, here are the recommended materials for a ${roomSize} sq meter room.`
      }

      setSuggestions(mockSuggestions)
    } catch (error) {
      setError("Failed to get material suggestions. Please try again.")
      console.error("Error getting material suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateTexture = async () => {
    setLoading(true)
    setError(null)
    setTexture(null)

    try {
      const response = await fetch(`${API_BASE_URL}/ai/texture-generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textureDescription }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate texture")
      }

      const imageBlob = await response.blob()
      const imageUrl = URL.createObjectURL(imageBlob)
      setTexture(imageUrl)
    } catch (error) {
      setError("Failed to generate texture. Please try again.")
      console.error("Error generating texture:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchMaterials = async () => {
    setLoading(true)
    setError(null)
    setProducts([])

    try {
      // Call real backend API for material search
      const response = await fetch(`${API_BASE_URL}/materials/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          room_type: roomType,
          style: style,
          budget_range: budget
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      setError("Failed to search for materials. Please try again.")
      console.error("Error searching for materials:", error)
      
      // Set some default mock products
      setProducts([
        {
          id: "1",
          name: "Sample Material",
          brand: "Mock Brand",
          price: 1000,
          image: "/placeholder.svg",
          retailer: "Mock Retailer"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BrickWall className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">AI Material Assistant</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Get AI-powered material suggestions, generate textures, and search for materials.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrickWall className="h-5 w-5" />
                Material Tools
              </CardTitle>
              <CardDescription>Select a tool to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="suggestions" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Material Suggestions
                  </TabsTrigger>
                  <TabsTrigger value="textures" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Texture Generation
                  </TabsTrigger>
                  <TabsTrigger value="search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Material Search
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="suggestions">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Get Material Suggestions</h3>
                      <div className="space-y-2">
                        <Label htmlFor="room-type">Room Type</Label>
                        <Input id="room-type" placeholder="e.g., Living Room, Kitchen" value={roomType} onChange={(e) => setRoomType(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="style">Design Style</Label>
                        <Input id="style" placeholder="e.g., Modern, Industrial" value={style} onChange={(e) => setStyle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room-size">Room Size (sq meters)</Label>
                        <Input id="room-size" placeholder="e.g., 25" type="number" value={roomSize} onChange={(e) => setRoomSize(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="durability">Durability Needs</Label>
                        <Input id="durability" placeholder="e.g., high, medium, low" value={durability} onChange={(e) => setDurability(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget Range</Label>
                        <Input id="budget" placeholder="e.g., low, medium, high" value={budget} onChange={(e) => setBudget(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="special-reqs">Special Requirements</Label>
                        <Textarea id="special-reqs" placeholder="e.g., Pet-friendly, easy to clean" value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
                      </div>
                      <Button onClick={getMaterialSuggestions} disabled={loading}>
                        {loading ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Getting Suggestions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Get Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Suggestions</h3>
                      {error && <p className="text-red-500">{error}</p>}
                      {progressMessage && (
                        <div className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                            <p className="text-blue-700">{progressMessage}</p>
                            {totalSteps > 0 && (
                              <span className="ml-2 text-sm text-blue-600">
                                ({progressStep}/{totalSteps})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {suggestions ? (
                        <div className="border rounded-lg p-4 space-y-4">
                          <div>
                            <h4 className="font-semibold">Flooring</h4>
                            {suggestions.flooring.primary_options.map((option, index) => (
                              <div key={index} className="p-2 border-b">
                                <p><strong>{option.material}</strong></p>
                                <p>{option.description}</p>
                                <p><strong>Pros:</strong> {option.pros.join(", ")}</p>
                                <p><strong>Cons:</strong> {option.cons.join(", ")}</p>
                                <p><strong>Cost:</strong> {option.cost_range}</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <h4 className="font-semibold">Walls</h4>
                            <p>{suggestions.walls.paint.recommended_types.join(", ")}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Ceiling</h4>
                            <p>{suggestions.ceiling.materials.join(", ")}</p>
                          </div>
                          <p><strong>Summary:</strong> {suggestions.summary}</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4 space-y-2">
                          <p className="text-muted-foreground">Suggestions will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="textures">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Generate a Texture</h3>
                      <div className="space-y-2">
                        <Label htmlFor="texture-description">Texture Description</Label>
                        <Textarea id="texture-description" placeholder="e.g., Rough, dark wood with visible grain" value={textureDescription} onChange={(e) => setTextureDescription(e.target.value)} />
                      </div>
                      <Button onClick={generateTexture} disabled={loading}>
                        {loading ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Generating Texture...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Texture
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Generated Texture</h3>
                      {error && <p className="text-red-500">{error}</p>}
                      {texture ? (
                        <img src={texture} alt="Generated texture" className="rounded-lg" />
                      ) : (
                        <div className="border rounded-lg p-4 flex items-center justify-center h-64">
                          <p className="text-muted-foreground">Generated texture will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="search">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Search for Materials</h3>
                    <div className="flex gap-2">
                      <Input placeholder="Search for materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      <Button onClick={searchMaterials} disabled={loading}>
                        {loading ? (
                          <>
                            <Search className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.length > 0 ? (
                        products.map((product) => (
                          <div key={product.id} className="border rounded-lg p-2">
                            <img src={product.image} alt={product.name} className="rounded-lg mb-2" />
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                            <p className="font-semibold">₹{product.price}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground col-span-full">Search results will appear here.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}