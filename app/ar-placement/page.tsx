"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

// Lazy load heavy AR components
const EnhancedARScene = dynamic(() => import("@/components/ar/enhanced-ar-scene").then(mod => ({ default: mod.EnhancedARScene || mod.default })), {
  loading: () => <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>,
  ssr: false
})
import { modelService, DEFAULT_FURNITURE_MODELS, ModelInfo } from "@/components/ar/model-service"
import {
  Cable as Cube,
  Camera,
  Search,
  Save,
  Share,
  Trash2,
  Ruler,
} from "lucide-react"

interface FurnitureItem {
  id: number
  name: string
  category: string
  price: string
  image: string
  dimensions: {
    width: number
    height: number
    depth: number
  }
  colors: string[]
  modelUrl?: string
  thumbnailUrl?: string
}

interface PlacedItem {
  id: string
  furnitureId: number
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  model?: any // THREE.Object3D
  selected?: boolean
}

const furnitureCategories = ["All", "Seating", "Tables", "Storage", "Lighting", "Decor"]

const furnitureItems: FurnitureItem[] = [
  {
    id: 1,
    name: "Modern Sofa",
    category: "Seating",
    price: "$1,299",
    image: "/modern-sofa.png",
    dimensions: { width: 200, height: 85, depth: 90 },
    colors: ["#8B4513", "#2F4F4F", "#696969"],
  },
  {
    id: 2,
    name: "Coffee Table",
    category: "Tables",
    price: "$399",
    image: "/modern-coffee-table.png",
    dimensions: { width: 120, height: 45, depth: 60 },
    colors: ["#8B4513", "#000000", "#FFFFFF"],
  },
  {
    id: 3,
    name: "Floor Lamp",
    category: "Lighting",
    price: "$199",
    image: "/modern-floor-lamp.png",
    dimensions: { width: 30, height: 160, depth: 30 },
    colors: ["#000000", "#FFFFFF", "#C0C0C0"],
  },
  {
    id: 4,
    name: "Bookshelf",
    category: "Storage",
    price: "$599",
    image: "/modern-bookshelf.png",
    dimensions: { width: 80, height: 200, depth: 30 },
    colors: ["#8B4513", "#FFFFFF", "#000000"],
  },
  {
    id: 5,
    name: "Dining Chair",
    category: "Seating",
    price: "$149",
    image: "/modern-dining-chair.png",
    dimensions: { width: 45, height: 85, depth: 50 },
    colors: ["#8B4513", "#000000", "#FFFFFF"],
  },
  {
    id: 6,
    name: "Side Table",
    category: "Tables",
    price: "$199",
    image: "/modern-side-table.jpg",
    dimensions: { width: 50, height: 55, depth: 50 },
    colors: ["#8B4513", "#FFFFFF", "#000000"],
  },
]

export default function ARPlacement() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<PlacedItem | null>(null)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [roomDimensions, setRoomDimensions] = useState({ width: 400, length: 500 })
  const [selectedFurnitureForPlacement, setSelectedFurnitureForPlacement] = useState<FurnitureItem | null>(null)

  useEffect(() => {
    console.log("AR Placement page loaded successfully")
  }, [])

  const filteredFurniture = furnitureItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handlePlaceItem = (item: PlacedItem) => {
    setPlacedItems((prev) => [...prev, item])
    setSelectedFurnitureForPlacement(null) // Deselect after placing
  }

  const removeSelectedItem = () => {
    if (!selectedItem) return

    setPlacedItems((prev) => prev.filter((item) => item.id !== selectedItem.id))
    setSelectedItem(null)
  }

  const handleUpdateItem = (updatedItem: PlacedItem) => {
    setPlacedItems((prev) => 
      prev.map((item) => item.id === updatedItem.id ? updatedItem : item)
    )
  }

  const handleDeleteItem = (itemId: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== itemId))
    if (selectedItem?.id === itemId) {
      setSelectedItem(null)
    }
  }

  const saveScene = () => {
    const sceneData = {
      items: placedItems,
      roomDimensions,
      timestamp: new Date().toISOString(),
    }

    console.log("Saving AR scene:", sceneData)
    // In production, this would save to a database
    alert("Scene saved successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Cube className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">AR Furniture Placement</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Visualize furniture in your space using augmented reality before you buy.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowMeasurements(!showMeasurements)}>
                  <Ruler className="h-4 w-4 mr-2" />
                  {showMeasurements ? "Hide" : "Show"} Measurements
                </Button>
                <Button variant="outline" onClick={saveScene} disabled={placedItems.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scene
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {placedItems.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Scene Items: {placedItems.length}</span>
                    <span className="text-sm text-muted-foreground">
                      Room: {roomDimensions.width}cm × {roomDimensions.length}cm
                    </span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setPlacedItems([])}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      AR Camera View
                    </div>
                  </CardTitle>
                  <CardDescription>Point your camera at the room to place furniture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    <EnhancedARScene
                      selectedFurniture={selectedFurnitureForPlacement}
                      onPlaceItem={handlePlaceItem}
                      placedItems={placedItems}
                      onUpdateItem={handleUpdateItem}
                      onDeleteItem={handleDeleteItem}
                    />
                  </div>

                  {selectedItem && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {furnitureItems.find((f) => f.id === selectedItem.furnitureId)?.name}
                        </h4>
                        <Button size="sm" variant="destructive" onClick={removeSelectedItem}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Furniture Catalog</CardTitle>
                  <CardDescription>Select items to place in your room</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search furniture..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="All">All</TabsTrigger>
                        <TabsTrigger value="Seating">Seating</TabsTrigger>
                      </TabsList>
                      <TabsList className="grid grid-cols-2 w-full mt-2">
                        <TabsTrigger value="Tables">Tables</TabsTrigger>
                        <TabsTrigger value="Storage">Storage</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredFurniture.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedFurnitureForPlacement?.id === item.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedFurnitureForPlacement(item)}
                        >
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <span className="text-xs font-semibold text-primary">{item.price}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}cm
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button className="w-full mt-4 bg-transparent" variant="outline">
                      Browse More Furniture
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Room Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Room Width (cm)</Label>
                    <Slider
                      value={[roomDimensions.width]}
                      onValueChange={([value]) => setRoomDimensions((prev) => ({ ...prev, width: value }))}
                      min={200}
                      max={800}
                      step={10}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{roomDimensions.width}cm</span>
                  </div>

                  <div>
                    <Label className="text-sm">Room Length (cm)</Label>
                    <Slider
                      value={[roomDimensions.length]}
                      onValueChange={([value]) => setRoomDimensions((prev) => ({ ...prev, length: value }))}
                      min={200}
                      max={1000}
                      step={10}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{roomDimensions.length}cm</span>
                  </div>
                </CardContent>
              </Card>

              {/* How to Use AR */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">How to Use AR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <p>Click the "Start AR" button</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <p>Point your device at a flat surface</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <p>Select a furniture item from the catalog</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                        4
                      </div>
                      <p>Tap the screen to place the item</p>
                    </div>
                     <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                        5
                      </div>
                      <p>Use touch gestures to move, rotate, and scale</p>
                    </div>
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
