"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { ARButton } from "three/examples/jsm/webxr/ARButton.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
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
  Palette
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

interface EnhancedARSceneProps {
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

const EnhancedARScene: React.FC<EnhancedARSceneProps> = ({ 
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

  // Check AR support on component mount
  useEffect(() => {
    checkARSupport()
  }, [])

  const checkARSupport = async () => {
    if ('xr' in navigator) {
      try {
        const isSupported = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setIsARSupported(isSupported)
        setArStatus(isSupported ? 'AR Ready!' : 'AR not supported on this device')
      } catch (error) {
        setIsARSupported(false)
        setArStatus('AR not available')
      }
    } else {
      setIsARSupported(false)
      setArStatus('WebXR not supported')
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

  // Load 3D model
  const loadModel = useCallback(async (furniture: FurnitureItem): Promise<THREE.Object3D> => {
    const cacheKey = `${furniture.id}-${furniture.modelUrl || furniture.category}`
    
    if (modelCacheRef.current.has(cacheKey)) {
      return modelCacheRef.current.get(cacheKey)!.clone()
    }

    setLoadingModel(true)
    
    try {
      const modelUrl = furniture.modelUrl || DEFAULT_MODELS[furniture.category.toLowerCase() as keyof typeof DEFAULT_MODELS]
      
      if (!modelUrl) {
        // Create a simple box geometry as fallback
        const geometry = new THREE.BoxGeometry(
          furniture.dimensions.width / 100,
          furniture.dimensions.height / 100,
          furniture.dimensions.depth / 100
        )
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.8,
          metalness: 0.2
        })
        const mesh = new THREE.Mesh(geometry, material)
        modelCacheRef.current.set(cacheKey, mesh)
        return mesh.clone()
      }

      const gltf = await new Promise<any>((resolve, reject) => {
        gltfLoaderRef.current!.load(
          modelUrl,
          resolve,
          undefined,
          reject
        )
      })

      const model = gltf.scene
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
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
      model.scale.setScalar(scale)

      modelCacheRef.current.set(cacheKey, model)
      return model.clone()
    } catch (error) {
      console.error('Failed to load model:', error)
      // Fallback to simple geometry
      const geometry = new THREE.BoxGeometry(
        furniture.dimensions.width / 100,
        furniture.dimensions.height / 100,
        furniture.dimensions.depth / 100
      )
      const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
      const mesh = new THREE.Mesh(geometry, material)
      return mesh
    } finally {
      setLoadingModel(false)
    }
  }, [])

  // Initialize AR scene
  useEffect(() => {
    if (!mountRef.current || !isAR) return

    initializeLoaders()

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.xr.enabled = true
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    mountRef.current.appendChild(renderer.domElement)

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Enhanced reticle
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2)
    const reticleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    })
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
    reticleRef.current = reticle

    // AR Button
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"]
    })
    arButton.style.position = 'fixed'
    arButton.style.bottom = '20px'
    arButton.style.left = '50%'
    arButton.style.transform = 'translateX(-50%)'
    arButton.style.zIndex = '1000'
    document.body.appendChild(arButton)

    // Controllers for interaction
    const controller = renderer.xr.getController(0)
    controller.addEventListener('select', handleSelect)
    scene.add(controller)
    controllerRef.current = controller

    // Animation loop
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

    // Session management
    renderer.xr.addEventListener('sessionstart', () => {
      sessionRef.current = renderer.xr.getSession()
      setShowControls(true)
      
      sessionRef.current?.requestReferenceSpace("local").then((referenceSpace) => {
        if (sessionRef.current?.requestHitTestSource) {
          sessionRef.current.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSourceRef.current = source
          })
        }
      })
    })

    renderer.xr.addEventListener('sessionend', () => {
      hitTestSourceRef.current = null
      sessionRef.current = null
      setShowControls(false)
    })

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement)
      }
      if (arButton && arButton.parentNode) {
        document.body.removeChild(arButton)
      }
      renderer.dispose()
    }
  }, [isAR, initializeLoaders])

  // Handle item selection
  const handleSelect = useCallback(() => {
    if (selectedFurniture && reticleRef.current?.visible) {
      handlePlaceItem()
    }
  }, [selectedFurniture])

  // Place item in AR
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
    } catch (error) {
      console.error('Failed to place item:', error)
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
  const ARControls = () => (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2">
      <Card className="bg-black/80 text-white border-gray-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="bg-green-500">
              AR Active
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAR(false)}>
                Exit AR
              </Button>
            </div>
          </div>
          
          {selectedFurniture && (
            <div className="text-sm">
              <p>Selected: {selectedFurniture.name}</p>
              <p className="text-gray-300">Point at a surface and tap to place</p>
            </div>
          )}
          
          {loadingModel && (
            <div className="text-sm text-yellow-400">
              Loading 3D model...
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

  return (
    <div ref={mountRef} className="relative w-full h-full">
      {!isAR && (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center p-8 max-w-md">
            <Camera className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-2">Enhanced AR Placement</h2>
            <p className="text-gray-600 mb-4">{arStatus}</p>
            
            {isARSupported ? (
              <Button 
                onClick={() => setIsAR(true)} 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start AR Experience
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-red-500 mb-2">AR not supported</p>
                <p className="text-sm text-gray-500">
                  Please use a compatible device with AR capabilities
                </p>
              </div>
            )}
            
            <div className="mt-6 text-sm text-gray-500">
              <p>✨ Real 3D models</p>
              <p>📱 WebXR powered</p>
              <p>🎯 Precise placement</p>
            </div>
          </div>
        </div>
      )}
      
      {isAR && showControls && <ARControls />}
    </div>
  )
}

export default EnhancedARScene
