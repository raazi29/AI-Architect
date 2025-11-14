"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ARManager } from "@/lib/utils/ar-utils"
import {
  Cable as Cube,
  Camera,
  Search,
  Smartphone,
  ArrowRight,
  X,
  Maximize2,
  Minimize2
} from "lucide-react"

// Dynamically import AR components to avoid SSR issues
const ModelViewerWrapper = dynamic(
  () => import('@/components/ar/ModelViewerWrapper'),
  { ssr: false }
);

const CrossPlatformARScene = dynamic(
  () => import('@/components/ar/CrossPlatformARScene'),
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

interface DashboardARPlacementProps {
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onClose?: () => void
}

export default function DashboardARPlacement({
  isFullscreen = false,
  onToggleFullscreen,
  onClose
}: DashboardARPlacementProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [useCrossPlatformAR, setUseCrossPlatformAR] = useState(false)

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
    
    // Check if cross-platform AR should be used
    const checkARSupport = async () => {
      if (typeof window !== 'undefined') {
        try {
          const arManager = new ARManager()
          const capabilities = await arManager.detectCapabilities()
          setUseCrossPlatformAR(capabilities.webXRSupported)
        } catch (error) {
          console.log('AR detection failed, using model-viewer fallback:', error)
          setUseCrossPlatformAR(false)
        }
      }
    }
    
    checkARSupport()
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
    setSelectedFurniture(null)
  }

  const handleModelLoad = () => {
    console.log('Model loaded successfully')
  }

  const handleError = (error: Error) => {
    console.error('AR Error:', error)
    alert(`Failed to load model: ${error.message}`)
  }

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background p-6 overflow-auto"
    : "w-full"

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cube className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AR Furniture Placement</h2>
            <p className="text-sm text-muted-foreground">
              {isMobile ? 'Place furniture in your space' : 'Scan QR code with mobile to try AR'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile AR Ready Banner */}
      {isMobile && !showViewer && (
        <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✨</div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  AR Ready on Your Device!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Select furniture below to view in your space with augmented reality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop QR Code */}
      {!isMobile && qrCodeUrl && !showViewer && (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  View in AR on Your Phone
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Scan this QR code with your mobile device to experience AR furniture placement
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">iOS 12+</Badge>
                  <Badge variant="outline" className="text-xs">Android 8+</Badge>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                <p className="text-center text-xs text-gray-600 mt-1">Scan to open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showViewer && selectedFurniture ? (
        /* AR Viewer Mode */
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-primary to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">{selectedFurniture.name}</CardTitle>
                <CardDescription className="text-white/80">{selectedFurniture.category} • {selectedFurniture.price}</CardDescription>
              </div>
              <Button variant="ghost" onClick={handleViewerClose} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative" style={{ minHeight: isMobile ? '60vh' : '400px' }}>
              {selectedFurniture.modelUrl ? (
                useCrossPlatformAR ? (
                  <CrossPlatformARScene
                    modelUrl={selectedFurniture.modelUrl}
                    modelName={selectedFurniture.name}
                    onModelLoad={handleModelLoad}
                    onError={handleError}
                    enablePerformanceMonitoring={true}
                    fallbackToModelViewer={true}
                  />
                ) : (
                  <ModelViewerWrapper
                    src={selectedFurniture.modelUrl}
                    alt={selectedFurniture.name}
                    ar={true}
                    arModes="webxr scene-viewer quick-look"
                    arScale="auto"
                    cameraControls={true}
                    autoRotate={true}
                    onLoad={handleModelLoad}
                    onError={handleError}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <p className="text-muted-foreground">No 3D model available</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-muted/50 border-t">
              <div className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">How to use AR:</p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>• <strong>Drag</strong> to rotate the model</li>
                    <li>• <strong>Pinch/Scroll</strong> to zoom in/out</li>
                    {isMobile && <li>• <strong>Tap &quot;View in AR&quot;</strong> to place in your space</li>}
                    {useCrossPlatformAR && <li>• <strong>Enhanced AR</strong> with performance monitoring</li>}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Furniture Catalog Mode */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Modern Furniture Catalog</CardTitle>
                <CardDescription>Select furniture to view in AR</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search furniture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {furnitureCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Furniture Grid */}
            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredFurniture.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => handleFurnitureSelect(item)}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary">
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                      <div className="text-4xl">{getCategoryIcon(item.category)}</div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                      <Badge className="absolute top-2 right-2 text-xs">{item.category}</Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold mb-1 line-clamp-1 text-sm">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}cm
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{item.price}</span>
                        <Button size="sm" className="gap-1 text-xs px-2 py-1">
                          View AR
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {filteredFurniture.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">No furniture found matching your search.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
