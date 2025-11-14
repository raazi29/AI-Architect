"use client"
export const dynamic = "force-dynamic"

import { ARManagerEnhanced } from "@/components/ar/ARManagerEnhanced"
import NextDynamic from "next/dynamic"

import { useState, useEffect } from "react"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Cable as Cube,
  Camera,
  Search,
  Save,
  Share,
  Smartphone,
  ArrowRight,
} from "lucide-react"


const ModelViewerWrapper = NextDynamic(
  () => import('@/components/ar/ModelViewerWrapper'),
  { ssr: false }
);

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

// Modern furniture catalog with actual 3D models
const furnitureItems: FurnitureItem[] = [
  {
    id: 1,
    name: "Decorative Lantern",
    category: "Lighting",
    price: "$89",
    image: "/placeholder.svg",
    dimensions: { width: 30, height: 60, depth: 30 },
    colors: ["#FFD700", "#000000"],
    modelUrl: "/models/lantern.glb"
  },
  {
    id: 2,
    name: "Modern Storage Box",
    category: "Storage",
    price: "$45",
    image: "/placeholder.svg",
    dimensions: { width: 40, height: 40, depth: 40 },
    colors: ["#8B4513", "#FFFFFF"],
    modelUrl: "/models/box.glb"
  },
  {
    id: 3,
    name: "Decorative Avocado",
    category: "Decor",
    price: "$29",
    image: "/placeholder.svg",
    dimensions: { width: 15, height: 20, depth: 15 },
    colors: ["#567D46", "#8B4513"],
    modelUrl: "/models/avocado.glb"
  },
  {
    id: 4,
    name: "Rubber Duck Decor",
    category: "Decor",
    price: "$19",
    image: "/placeholder.svg",
    dimensions: { width: 20, height: 25, depth: 20 },
    colors: ["#FFD700", "#FFA500"],
    modelUrl: "/models/duck.glb"
  },
  {
    id: 5,
    name: "Modern Chair (Sample)",
    category: "Seating",
    price: "$299",
    image: "/placeholder.svg",
    dimensions: { width: 60, height: 85, depth: 65 },
    colors: ["#8B4513", "#2F4F4F"],
    modelUrl: "/models/furniture/modern/sample (39).glb"
  },
]

export default function ARPlacement() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [arMode, setArMode] = useState<'webxr' | 'model-viewer' | 'fallback'>('fallback')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      setIsMobile(mobile)
      
      if (!mobile && typeof window !== 'undefined') {
        const currentUrl = window.location.href
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile && !showViewer && furnitureItems.length > 0) {
      setSelectedFurniture(furnitureItems[0])
      setShowViewer(true)
    }
  }, [isMobile, showViewer])

  const filteredFurniture = furnitureItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleFurnitureSelect = (item: FurnitureItem) => {
    setSelectedFurniture(item)
    setShowViewer(true)
  }

  const handleViewerClose = () => {
    setShowViewer(false)
  }

  const handleModelLoad = () => {
    console.log('Model loaded successfully')
  }

  const handleError = (error: Error) => {
    console.error('AR Error:', error)
    alert(`Failed to load model: ${error.message}`)
  }

  const handleARStart = () => {
    console.log('AR session started')
  }

  const handleAREnd = () => {
    console.log('AR session ended')
  }

  const handleObjectPlaced = (objectId: string) => {
    console.log('Object placed:', objectId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Cube className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">AR Furniture Placement</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isMobile ? 'Place furniture in your space' : 'Scan QR code with mobile to try AR'}
                    </p>
                  </div>
                </div>
              </div>

              {showViewer && (
                <Button variant="outline" onClick={handleViewerClose}>
                  Close
                </Button>
              )}
            </div>

            
          </div>

          {showViewer && selectedFurniture ? (
            /* AR Viewer Mode */
            <Card>
                    <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{selectedFurniture.name}</CardTitle>
                          <CardDescription className="text-white/80">{selectedFurniture.category}</CardDescription>
                        </div>
                        <Button variant="ghost" onClick={handleViewerClose} className="text-white hover:bg-white/20">
                          Close
                        </Button>
                      </div>
                    </CardHeader>
              <CardContent className="p-0">
                <div className="relative" style={{ minHeight: isMobile ? '70vh' : '600px' }}>
                  {selectedFurniture.modelUrl ? (
                    <ARManagerEnhanced
                      modelUrl={selectedFurniture.modelUrl}
                      onARStart={handleARStart}
                      onAREnd={handleAREnd}
                      onObjectPlaced={handleObjectPlaced}
                      onError={handleError}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <p className="text-muted-foreground">No 3D model available</p>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="p-6 bg-muted/50 border-t">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">How to use AR:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• <strong>Drag</strong> to rotate the model</li>
                        <li>• <strong>Pinch/Scroll</strong> to zoom in/out</li>
                        {isMobile && <li>• <strong>Tap "View in AR"</strong> to place in your space</li>}
                        <li>• <strong>Auto-adaptive quality</strong> ensures smooth performance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Furniture Catalog Mode */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            <div className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Modern Furniture Catalog</CardTitle>
                      <CardDescription>Select furniture to view in AR</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Category Tabs */}
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {furnitureCategories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>

                  {/* Furniture Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFurniture.map((item) => (
                      <div
                        key={item.id}
                        className="group cursor-pointer"
                        onClick={() => handleFurnitureSelect(item)}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary">
                          <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                            <div className="text-6xl">{getCategoryIcon(item.category)}</div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                            <Badge className="absolute top-3 right-3">{item.category}</Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}cm
                            </p>
                          <div className="flex items-center justify-end">
                            <Button size="sm" className="gap-1">
                              View
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {filteredFurniture.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No furniture found matching your search.</p>
                      <Button variant="outline" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}>
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Helper function to get category icons
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Lighting': '💡',
    'Storage': '📦',
    'Decor': '🎨',
    'Seating': '🪑',
    'Tables': '🪑',
  }
  return icons[category] || '🛋️'
}
