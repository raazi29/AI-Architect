"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { ARButton } from "three/examples/jsm/webxr/ARButton.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { ARManager, ARUtils, ARPerformanceMonitor } from "@/lib/utils/ar-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Camera, 
  RotateCcw, 
  Move3D, 
  Trash2, 
  Download,
  Share2,
  Maximize,
  Minimize,
  Palette,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface FurnitureItem {
  id: number
  name: string
  dimensions: { width: number; height: number; depth: number }
  modelUrl?: string // URL to 3D model (GLTF/GLB)
  thumbnailUrl?: string
  category: string
  price?: string
  colors?: string[]
}

interface PlacedItem {
  id: string
  furnitureId: number
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  model?: THREE.Object3D
  selected?: boolean
}

interface CrossPlatformARSceneProps {
  selectedFurniture: FurnitureItem | null
  onPlaceItem: (item: PlacedItem) => void
  placedItems: PlacedItem[]
  onUpdateItem?: (item: PlacedItem) => void
  onDeleteItem?: (itemId: string) => void
}

// Default 3D models for common furniture types
const DEFAULT_MODELS = {
  sofa: '/models/furniture/sofa.glb',
  chair: '/models/furniture/chair.glb',
  table: '/models/furniture/table.glb',
  bed: '/models/furniture/bed.glb',
  cabinet: '/models/furniture/cabinet.glb',
  lamp: '/models/furniture/lamp.glb',
  bookshelf: '/models/furniture/bookshelf.glb',
  desk: '/models/furniture/desk.glb'
}

const CrossPlatformARScene: React.FC<CrossPlatformARSceneProps> = ({ 
  selectedFurniture, 
  onPlaceItem, 
  placedItems,
  onUpdateItem,
  onDeleteItem 
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const reticleRef = useRef<THREE.Mesh | null>(null)
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null)
  const gltfLoaderRef = useRef<GLTFLoader | null>(null)
  const modelCacheRef = useRef<Map<string, THREE.Object3D>>(new Map())
  const controllerRef = useRef<THREE.Group | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const sessionRef = useRef<XRSession | null>(null)

  const [isAR, setIsAR] = useState(false)
  const [isARSupported, setIsARSupported] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)
  const [arStatus, setArStatus] = useState<string>('Checking AR support...')
  const [selectedItem, setSelectedItem] = useState<PlacedItem | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [arCapabilities, setArCapabilities] = useState<any>(null)
  const [arManager] = useState(() => ARManager.getInstance())
  const [performanceMonitor] = useState(() => new ARPerformanceMonitor())
  const [arMode, setArMode] = useState<'webxr' | 'model-viewer' | 'fallback'>('fallback')
  const [initializationError, setInitializationError] = useState<string | null>(null)

  // Check AR support on component mount
  useEffect(() => {
    checkARSupport()
  }, [])

  const checkARSupport = async () => {
    try {
      setArStatus('Detecting AR capabilities...')
      
      const capabilities = await arManager.detectCapabilities()
      setArCapabilities(capabilities)
      
      const bestMode = arManager.getBestARImplementation()
      setArMode(bestMode)
      
      const isSupported = capabilities.webXRSupported || capabilities.modelViewerSupported
      setIsARSupported(isSupported)
      
      if (capabilities.webXRSupported) {
        setArStatus('WebXR Ready!')
      } else if (capabilities.modelViewerSupported) {
        setArStatus('Model Viewer Ready!')
      } else {
        setArStatus('AR not supported on this device')
      }
      
      console.log('AR Capabilities:', capabilities)
      console.log('Best AR Mode:', bestMode)
      
    } catch (error) {
      console.error('Failed to check AR support:', error)
      setIsARSupported(false)
      setArStatus('Failed to detect AR support')
      setInitializationError('Failed to initialize AR capabilities')
    }
  }

  // Initialize 3D loaders
  const initializeLoaders = useCallback(() => {
    if (!gltfLoaderRef.current) {
      const loader = new GLTFLoader()
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      loader.setDRACOLoader(dracoLoader)
      gltfLoaderRef.current = loader
    }
  }, [])

  // Enhanced model loading with better error handling
  const loadModel = useCallback(async (furniture: FurnitureItem): Promise<THREE.Object3D> => {
    const cacheKey = `${furniture.id}-${furniture.modelUrl || furniture.category}`
    
    if (modelCacheRef.current.has(cacheKey)) {
      return modelCacheRef.current.get(cacheKey)!.clone()
    }

    setLoadingModel(true)
    
    try {
      // Validate model URL
      const modelUrl = furniture.modelUrl || DEFAULT_MODELS[furniture.category.toLowerCase() as keyof typeof DEFAULT_MODELS]
      
      if (!modelUrl) {
        console.warn('No model URL found for furniture:', furniture.name)
        return createFallbackModel(furniture)
      }

      // Validate model format
      if (!ARUtils.validateModelFormat(modelUrl)) {
        console.warn('Invalid model format:', modelUrl)
        return createFallbackModel(furniture)
      }

      // Format model URL for cross-platform compatibility
      const formattedUrl = ARUtils.formatModelUrl(modelUrl)

      const gltf = await new Promise<any>((resolve, reject) => {
        gltfLoaderRef.current!.load(
          formattedUrl,
          resolve,
          (progress) => {
            console.log('Model loading progress:', progress)
          },
          (error) => {
            console.error('Model loading error:', error)
            reject(error)
          }
        )
      })

      const model = gltf.scene
      
      // Configure model properties
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Optimize materials for mobile/low-end devices
          if (arCapabilities?.isLowEndDevice) {
            if (child.material) {
              child.material.roughness = Math.min(child.material.roughness || 0.8, 0.8)
              child.material.metalness = Math.min(child.material.metalness || 0.2, 0.2)
            }
          }
        }
      })

      // Scale model to match furniture dimensions
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const scale = Math.min(
        furniture.dimensions.width / 100 / size.x,
        furniture.dimensions.height / 100 / size.y,
        furniture.dimensions.depth / 100 / size.z
      )
      model.scale.setScalar(scale * 0.9) // Slightly smaller for better placement

      modelCacheRef.current.set(cacheKey, model)
      return model.clone()
    } catch (error) {
      console.error('Failed to load model:', error)
      return createFallbackModel(furniture)
    } finally {
      setLoadingModel(false)
    }
  }, [arCapabilities])

  // Create fallback 3D model when main model fails to load
  const createFallbackModel = (furniture: FurnitureItem): THREE.Object3D => {
    console.log('Creating fallback model for:', furniture.name)
    
    const geometry = new THREE.BoxGeometry(
      furniture.dimensions.width / 100,
      furniture.dimensions.height / 100,
      furniture.dimensions.depth / 100
    )
    
    // Use different colors for different furniture categories
    const categoryColors: Record<string, number> = {
      'Seating': 0x8B4513, // Brown
      'Tables': 0x654321, // Dark brown
      'Storage': 0x2F4F4F, // Dark slate gray
      'Lighting': 0xFFD700, // Gold
      'Decor': 0xFF6B6B, // Light coral
    }
    
    const color = categoryColors[furniture.category] || 0x8B4513
    
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.8,
      metalness: 0.2
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    return mesh
  }

  // Enhanced AR session initialization
  useEffect(() => {
    if (!mountRef.current || !isAR) return

    initializeLoaders()

    // Start performance monitoring
    performanceMonitor.startMonitoring()

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera

    // Renderer with enhanced settings for cross-platform compatibility
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
    renderer.xr.enabled = true
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    mountRef.current.appendChild(renderer.domElement)

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    scene.add(directionalLight)

    // Enhanced reticle with better visibility
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2)
    const reticleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    // AR Button with enhanced configuration
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation", "anchors"]
    })
    
    arButton.style.position = 'fixed'
    arButton.style.bottom = '20px'
    arButton.style.left = '50%'
    arButton.style.transform = 'translateX(-50%)'
    arButton.style.zIndex = '1000'
    arButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    arButton.style.border = 'none'
    arButton.style.borderRadius = '25px'
    arButton.style.padding = '12px 24px'
    arButton.style.color = 'white'
    arButton.style.fontWeight = 'bold'
    arButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
    
    document.body.appendChild(arButton)

    // Controllers for interaction
    const controller = renderer.xr.getController(0)
    controller.addEventListener('select', handleSelect)
    scene.add(controller)
    controllerRef.current = controller

    // Enhanced animation loop with performance monitoring
    renderer.setAnimationLoop(async (timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace()
        if (hitTestSourceRef.current && referenceSpace) {
          const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current)
          if (hitTestResults.length) {
            const hit = hitTestResults[0]
            const pose = hit.getPose(referenceSpace)
            if (pose) {
              reticle.visible = true
              reticle.matrix.fromArray(pose.transform.matrix)
            } else {
              reticle.visible = false
            }
          } else {
            reticle.visible = false
          }
        }
      }
      renderer.render(scene, camera)
    })

    // Session management with enhanced error handling
    renderer.xr.addEventListener('sessionstart', async () => {
      try {
        sessionRef.current = renderer.xr.getSession()
        setShowControls(true)
        
        if (sessionRef.current?.requestReferenceSpace) {
          const referenceSpace = await sessionRef.current.requestReferenceSpace("local")
          
          if (sessionRef.current.requestHitTestSource) {
            try {
              const source = await sessionRef.current.requestHitTestSource({ 
                space: referenceSpace 
              })
              hitTestSourceRef.current = source
            } catch (hitTestError) {
              console.warn('Hit test source request failed:', hitTestError)
            }
          }
        }
        
        console.log('AR session started successfully')
      } catch (error) {
        console.error('Failed to start AR session:', error)
        setInitializationError('Failed to initialize AR session')
      }
    })

    renderer.xr.addEventListener('sessionend', () => {
      hitTestSourceRef.current = null
      sessionRef.current = null
      setShowControls(false)
      performanceMonitor.stopMonitoring()
      console.log('AR session ended')
    })

    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      performanceMonitor.stopMonitoring()
      
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement)
      }
      
      if (arButton && arButton.parentNode) {
        document.body.removeChild(arButton)
      }
      
      renderer.dispose()
    }
  }, [isAR, initializeLoaders, performanceMonitor, arCapabilities])

  // Handle item selection
  const handleSelect = useCallback(() => {
    if (selectedFurniture && reticleRef.current?.visible) {
      handlePlaceItem()
    }
  }, [selectedFurniture])

  // Enhanced item placement
  const handlePlaceItem = useCallback(async () => {
    if (!selectedFurniture || !reticleRef.current?.visible) return

    const position = new THREE.Vector3()
    reticleRef.current.getWorldPosition(position)

    try {
      const model = await loadModel(selectedFurniture)
      
      const newItem: PlacedItem = {
        id: `${selectedFurniture.id}-${Date.now()}`,
        furnitureId: selectedFurniture.id,
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        model
      }

      onPlaceItem(newItem)
      console.log('Item placed successfully:', newItem)
    } catch (error) {
      console.error('Failed to place item:', error)
      setInitializationError('Failed to place furniture item')
    }
  }, [selectedFurniture, loadModel, onPlaceItem])

  // Update placed items in scene
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Clear existing furniture objects (keep lights and reticle)
    const objectsToRemove = scene.children.filter(child => 
      child.userData.isFurniture
    )
    objectsToRemove.forEach(obj => scene.remove(obj))

    // Add placed items
    placedItems.forEach((item) => {
      if (item.model) {
        const model = item.model.clone()
        model.position.set(item.position.x, item.position.y, item.position.z)
        model.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
        model.scale.set(item.scale.x, item.scale.y, item.scale.z)
        model.userData.isFurniture = true
        model.userData.itemId = item.id
        
        // Add selection highlight
        if (item.selected) {
          const box = new THREE.BoxHelper(model, 0x00ff00)
          scene.add(box)
        }
        
        scene.add(model)
      }
    })
  }, [placedItems])

  // AR Controls Component
  const ARControls = () => {
    const [performanceStats, setPerformanceStats] = useState<any>(null)
    
    useEffect(() => {
      const updateStats = () => {
        const stats = performanceMonitor.getPerformanceStats()
        setPerformanceStats(stats)
        requestAnimationFrame(updateStats)
      }
      updateStats()
    }, [performanceMonitor])

    return (
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2">
        <Card className="bg-black/80 text-white border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                AR Active ({arMode})
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsAR(false)}>
                  Exit AR
                </Button>
              </div>
            </div>
            
            {selectedFurniture && (
              <div className="text-sm mb-2">
                <p>Selected: {selectedFurniture.name}</p>
                <p className="text-gray-300">Point at a surface and tap to place</p>
              </div>
            )}
            
            {loadingModel && (
              <div className="text-sm text-yellow-400">
                Loading 3D model...
              </div>
            )}
            
            {performanceStats && (
              <div className="text-xs text-gray-400 mt-2">
                FPS: {Math.round(performanceStats.averageFPS || 0)} | 
                Memory: {Math.round(performanceStats.memoryUsage || 0)}MB
              </div>
            )}
          </CardContent>
        </Card>

        {selectedItem && (
          <Card className="bg-black/80 text-white border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Item Controls</span>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDeleteItem?.(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Move3D className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Error Display Component
  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
      <div className="text-center p-6 max-w-md">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AR Error</h3>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setInitializationError(null)
            checkARSupport()
          }}
        >
          Retry
        </Button>
      </div>
    </div>
  )

  return (
    <div ref={mountRef} className="relative w-full h-full">
      {initializationError && <ErrorDisplay error={initializationError} />}
      
      {!isAR && !initializationError && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center p-8 max-w-md">
            <Camera className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2">Cross-Platform AR</h2>
            <p className="text-gray-600 mb-4">{arStatus}</p>
            
            {arCapabilities && (
              <div className="mb-4 p-4 bg-white/50 rounded-lg">
                <h3 className="font-semibold mb-2">Device Capabilities:</h3>
                <div className="text-sm text-left space-y-1">
                  <div className="flex justify-between">
                    <span>WebXR:</span>
                    <span className={arCapabilities.webXRSupported ? 'text-green-600' : 'text-red-600'}>
                      {arCapabilities.webXRSupported ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Viewer:</span>
                    <span className={arCapabilities.modelViewerSupported ? 'text-green-600' : 'text-red-600'}>
                      {arCapabilities.modelViewerSupported ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device:</span>
                    <span className="capitalize">{arCapabilities.deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span className={arCapabilities.isLowEndDevice ? 'text-yellow-600' : 'text-green-600'}>
                      {arCapabilities.isLowEndDevice ? 'Low-end' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {isARSupported ? (
              <Button 
                onClick={() => setIsAR(true)} 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start AR Experience ({arMode})
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-red-500 mb-2">AR not supported</p>
                <p className="text-sm text-gray-500">
                  Please use a compatible device with AR capabilities
                </p>
                {arCapabilities?.deviceType === 'desktop' && (
                  <p className="text-sm text-gray-500 mt-2">
                    Try on a mobile device for the best AR experience
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-6 text-sm text-gray-500">
              <p>✨ Real 3D models with fallback support</p>
              <p>📱 Cross-platform compatibility</p>
              <p>🎯 Enhanced performance monitoring</p>
            </div>
          </div>
        </div>
      )}
      
      {isAR && showControls && <ARControls />}
    </div>
  )
}

export default CrossPlatformARScene