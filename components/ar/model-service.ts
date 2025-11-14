// 3D Model Service for AR Furniture Placement
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export interface ModelInfo {
  id: string
  name: string
  category: string
  url: string
  iosSrc?: string
  thumbnailUrl?: string
  dimensions: { width: number; height: number; depth: number }
  materials?: string[]
  tags?: string[]
  license?: string
  licenseUrl?: string
  sourceUrl?: string
  author?: string
}

// Free 3D model sources and repositories
export const MODEL_SOURCES = {
  // Sketchfab (many free CC models)
  sketchfab: 'https://sketchfab.com/3d-models/',
  
  // Poly Haven (free CC0 models)
  polyhaven: 'https://polyhaven.com/models',
  
  // Free3D
  free3d: 'https://free3d.com/',
  
  // TurboSquid (some free models)
  turbosquid: 'https://www.turbosquid.com/Search/3D-Models/free',
  
  // CGTrader (some free models)
  cgtrader: 'https://www.cgtrader.com/free-3d-models'
}

// Default furniture models (these would be hosted on your server)
export const DEFAULT_FURNITURE_MODELS: ModelInfo[] = [
  {
    id: 'table-coffee-gothic',
    name: 'Gothic Coffee Table',
    category: 'table',
    url: '/models/furniture/table-coffee-gothic.glb',
    dimensions: { width: 120, height: 45, depth: 60 },
    materials: ['wood'],
    tags: ['table', 'coffee', 'polyhaven'],
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://polyhaven.com/a/gothic_coffee_table',
    author: 'Poly Haven'
  },
  {
    id: 'table-coffee-industrial',
    name: 'Industrial Coffee Table',
    category: 'table',
    url: '/models/furniture/table-coffee-industrial.glb',
    dimensions: { width: 120, height: 45, depth: 60 },
    materials: ['wood', 'metal'],
    tags: ['table', 'coffee', 'polyhaven'],
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://polyhaven.com/a/industrial_coffee_table',
    author: 'Poly Haven'
  },
  {
    id: 'table-round-wooden',
    name: 'Round Wooden Table',
    category: 'table',
    url: '/models/furniture/table-round-wooden.glb',
    dimensions: { width: 110, height: 75, depth: 110 },
    materials: ['wood'],
    tags: ['table', 'round', 'polyhaven'],
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://polyhaven.com/a/round_wooden_table_02',
    author: 'Poly Haven'
  },
  {
    id: 'chair-lounge-midcentury',
    name: 'Mid Century Lounge Chair',
    category: 'chair',
    url: '/models/furniture/chair-lounge-midcentury.glb',
    dimensions: { width: 70, height: 85, depth: 70 },
    materials: ['wood', 'fabric'],
    tags: ['chair', 'lounge', 'polyhaven'],
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://polyhaven.com/a/mid_century_lounge_chair',
    author: 'Poly Haven'
  },
  {
    id: 'lamp-wall-industrial',
    name: 'Industrial Wall Lamp',
    category: 'lamp',
    url: '/models/furniture/lamp-wall-industrial.glb',
    dimensions: { width: 25, height: 30, depth: 40 },
    materials: ['metal'],
    tags: ['lamp', 'wall', 'polyhaven'],
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://polyhaven.com/a/industrial_wall_lamp',
    author: 'Poly Haven'
  }
]

class ModelService {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader
  private modelCache: Map<string, THREE.Object3D> = new Map()
  private loadingPromises: Map<string, Promise<THREE.Object3D>> = new Map()

  constructor() {
    this.loader = new GLTFLoader()
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    this.loader.setDRACOLoader(this.dracoLoader)
  }

  /**
   * Load a 3D model from URL
   */
  async loadModel(modelInfo: ModelInfo): Promise<THREE.Object3D> {
    const cacheKey = modelInfo.id

    // Return cached model if available
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!.clone()
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      const model = await this.loadingPromises.get(cacheKey)!
      return model.clone()
    }

    // Start loading
    const loadingPromise = this.loadModelFromUrl(modelInfo)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const model = await loadingPromise
      this.modelCache.set(cacheKey, model)
      this.loadingPromises.delete(cacheKey)
      return model.clone()
    } catch (error) {
      this.loadingPromises.delete(cacheKey)
      throw error
    }
  }

  /**
   * Load model from URL with fallback to procedural generation
   */
  private async loadModelFromUrl(modelInfo: ModelInfo): Promise<THREE.Object3D> {
    try {
      const gltf = await new Promise<any>((resolve, reject) => {
        this.loader.load(
          modelInfo.url,
          resolve,
          (progress) => {
            console.log(`Loading ${modelInfo.name}: ${(progress.loaded / progress.total * 100)}%`)
          },
          reject
        )
      })

      const model = gltf.scene
      this.setupModel(model, modelInfo)
      return model
    } catch (error) {
      console.warn(`Failed to load model ${modelInfo.name}, creating fallback:`, error)
      return this.createFallbackModel(modelInfo)
    }
  }

  /**
   * Setup loaded model with proper materials, shadows, etc.
   */
  private setupModel(model: THREE.Object3D, modelInfo: ModelInfo) {
    model.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Enhance materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material) => {
              this.enhanceMaterial(mat)
            })
          } else {
            this.enhanceMaterial(child.material)
          }
        }
      }
    })

    // Scale model to match specified dimensions
    this.scaleModelToDimensions(model, modelInfo.dimensions)
    
    // Add metadata
    model.userData = {
      modelInfo,
      originalDimensions: modelInfo.dimensions
    }
  }

  /**
   * Enhance material properties for better AR rendering
   */
  private enhanceMaterial(material: THREE.Material) {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = Math.max(0.1, material.roughness || 0.5)
      material.metalness = Math.min(0.9, material.metalness || 0.1)
      material.envMapIntensity = 1.0
    }
  }

  /**
   * Scale model to match specified dimensions
   */
  private scaleModelToDimensions(model: THREE.Object3D, dimensions: { width: number; height: number; depth: number }) {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    
    const scaleX = (dimensions.width / 100) / size.x
    const scaleY = (dimensions.height / 100) / size.y
    const scaleZ = (dimensions.depth / 100) / size.z
    
    // Use uniform scaling based on the smallest scale factor to maintain proportions
    const uniformScale = Math.min(scaleX, scaleY, scaleZ)
    model.scale.setScalar(uniformScale)
  }

  /**
   * Create a fallback procedural model when 3D model fails to load
   */
  private createFallbackModel(modelInfo: ModelInfo): THREE.Object3D {
    const group = new THREE.Group()
    
    // Create basic geometry based on category
    let geometry: THREE.BufferGeometry
    let material: THREE.Material
    
    switch (modelInfo.category.toLowerCase()) {
      case 'sofa':
        geometry = this.createSofaGeometry(modelInfo.dimensions)
        material = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513, 
          roughness: 0.8,
          metalness: 0.1 
        })
        break
        
      case 'chair':
        geometry = this.createChairGeometry(modelInfo.dimensions)
        material = new THREE.MeshStandardMaterial({ 
          color: 0x654321,
          roughness: 0.7,
          metalness: 0.1 
        })
        break
        
      case 'table':
        geometry = this.createTableGeometry(modelInfo.dimensions)
        material = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.6,
          metalness: 0.2 
        })
        break
        
      default:
        geometry = new THREE.BoxGeometry(
          modelInfo.dimensions.width / 100,
          modelInfo.dimensions.height / 100,
          modelInfo.dimensions.depth / 100
        )
        material = new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.7,
          metalness: 0.1 
        })
    }
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    
    // Add metadata
    group.userData = {
      modelInfo,
      isFallback: true
    }
    
    return group
  }

  /**
   * Create procedural sofa geometry
   */
  private createSofaGeometry(dimensions: { width: number; height: number; depth: number }): THREE.BufferGeometry {
    const group = new THREE.Group()
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(
      dimensions.width / 100,
      dimensions.height / 100 * 0.6,
      dimensions.depth / 100
    )
    
    // Backrest
    const backGeometry = new THREE.BoxGeometry(
      dimensions.width / 100,
      dimensions.height / 100 * 0.8,
      dimensions.depth / 100 * 0.2
    )
    
    // Combine geometries (simplified for this example)
    return bodyGeometry
  }

  /**
   * Create procedural chair geometry
   */
  private createChairGeometry(dimensions: { width: number; height: number; depth: number }): THREE.BufferGeometry {
    // Simplified chair geometry
    return new THREE.BoxGeometry(
      dimensions.width / 100,
      dimensions.height / 100,
      dimensions.depth / 100
    )
  }

  /**
   * Create procedural table geometry
   */
  private createTableGeometry(dimensions: { width: number; height: number; depth: number }): THREE.BufferGeometry {
    // Simplified table geometry
    return new THREE.BoxGeometry(
      dimensions.width / 100,
      dimensions.height / 100,
      dimensions.depth / 100
    )
  }

  /**
   * Get available models by category
   */
  getModelsByCategory(category: string): ModelInfo[] {
    return DEFAULT_FURNITURE_MODELS.filter(model => 
      model.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Search models by name or tags
   */
  searchModels(query: string): ModelInfo[] {
    const lowerQuery = query.toLowerCase()
    return DEFAULT_FURNITURE_MODELS.filter(model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.category.toLowerCase().includes(lowerQuery) ||
      model.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * Get all available models
   */
  getAllModels(): ModelInfo[] {
    return [...DEFAULT_FURNITURE_MODELS]
  }

  /**
   * Find model metadata by URL
   */
  getModelByUrl(url: string): ModelInfo | null {
    const match = DEFAULT_FURNITURE_MODELS.find(m => m.url === url)
    return match || null
  }

  verifyLicense(model: ModelInfo, allowed: string[] = ['CC0', 'CC-BY', 'CC-BY-SA']): boolean {
    if (!model.license) return false
    return allowed.includes(model.license)
  }

  getLicensedModels(allowed: string[] = ['CC0', 'CC-BY', 'CC-BY-SA']): ModelInfo[] {
    return DEFAULT_FURNITURE_MODELS.filter(m => this.verifyLicense(m, allowed))
  }

  /**
   * Clear model cache
   */
  clearCache() {
    this.modelCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.clearCache()
    this.dracoLoader.dispose()
  }
}

// Export singleton instance
export const modelService = new ModelService()
export default modelService
