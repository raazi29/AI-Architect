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
    setLoading(true)
    setError(null)
    setSuggestions(null)
    setProgressMessage(null)
    setProgressStep(0)
    setTotalSteps(0)

    try {
      const response = await fetch("http://localhost:8001/ai/materials-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_type: roomType,
          style: style,
          room_size: parseFloat(roomSize),
          durability_needs: durability,
          budget_range: budget,
          special_requirements: specialRequirements,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get material suggestions")
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process each complete event
        const lines = buffer.split('\n')
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) // Remove "data: " prefix

              if (data.status === 'processing' || data.status === 'ai_processing') {
                // Update UI to show processing status with progress
                setProgressMessage(data.message)
                if (data.step !== undefined && data.total_steps !== undefined) {
                  setProgressStep(data.step)
                  setTotalSteps(data.total_steps)
                }
              } else if (data.partial_response) {
                // Handle partial response - this would require building up the full JSON
                // For now, we'll focus on complete responses
              } else if (data.complete_response) {
                // Got the complete response
                setSuggestions(data.complete_response)
                setProgressMessage(null)
                setProgressStep(0)
                setTotalSteps(0)
              } else if (data.raw_response && data.status === 'complete') {
                // Handle raw response if JSON parsing failed
                setError("Received response but could not parse as structured data")
                console.warn("Raw response:", data.raw_response)
                setProgressMessage(null)
                setProgressStep(0)
                setTotalSteps(0)
              } else if (data.error) {
                setError(data.message || "An error occurred while processing the request")
                setProgressMessage(null)
                setProgressStep(0)
                setTotalSteps(0)
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, line)
            }
          }
        }
      }
    } catch (error) {
      setError("Failed to get material suggestions. Please try again.")
      console.error("Error getting material suggestions:", error)
    } finally {
      setLoading(false)
      setProgressMessage(null)
      setProgressStep(0)
      setTotalSteps(0)
    }
  }

  const generateTexture = async () => {
    setLoading(true)
    setError(null)
    setTexture(null)

    try {
      const response = await fetch("http://localhost:8001/ai/texture-generation", {
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
      // Simulate search with mock data since backend is disabled
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock products data
      const mockProducts = [
        {
          id: "1",
          name: "Engineered Wood Flooring",
          brand: "Greenlam",
          price: 1200,
          image: "/placeholder.svg"
        },
        {
          id: "2",
          name: "Vitrified Tiles",
          brand: "Kajaria",
          price: 80,
          image: "/placeholder.svg"
        },
        {
          id: "3",
          name: "Italian Marble Slab",
          brand: "Ambika Marble",
          price: 450,
          image: "/placeholder.svg"
        },
        {
          id: "4",
          name: "Premium Wall Paint",
          brand: "Asian Paints",
          price: 1200,
          image: "/placeholder.svg"
        },
        {
          id: "5",
          name: "Designer Ceiling Fan",
          brand: "Crompton",
          price: 3500,
          image: "/placeholder.svg"
        },
        {
          id: "6",
          name: "Granite Kitchen Platform",
          brand: "Centacem",
          price: 250,
          image: "/placeholder.svg"
        }
      ]

      // Filter mock products based on search query
      const filteredProducts = mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setProducts(filteredProducts)
    } catch (error) {
      setError("Failed to search for materials. Using mock data.")
      console.error("Error searching for materials:", error)
      
      // Set some default mock products
      setProducts([
        {
          id: "1",
          name: "Sample Material",
          brand: "Mock Brand",
          price: 1000,
          image: "/placeholder.svg"
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