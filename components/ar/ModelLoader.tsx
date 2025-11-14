import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ModelCache, ModelLoadProgress } from '@/lib/types/ar';

/**
 * ModelLoader Class
 * 
 * Handles loading, caching, and optimization of 3D models in GLB/GLTF format.
 * Provides progress tracking and error handling for model loading operations.
 */
export class ModelLoader {
  private loader: GLTFLoader;
  private cache: Map<string, ModelCache>;
  private loadingPromises: Map<string, Promise<THREE.Object3D>>;
  private maxCacheSize: number;
  private maxModelSize: number; // in bytes

  constructor(maxCacheSize: number = 10, maxModelSize: number = 10 * 1024 * 1024) {
    this.loader = new GLTFLoader();
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.maxCacheSize = maxCacheSize;
    this.maxModelSize = maxModelSize;
  }

  /**
   * Load a 3D model from URL with caching
   */
  async loadModel(
    url: string,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<THREE.Object3D> {
    // Check cache first
    const cached = this.getCachedModel(url);
    if (cached) {
      console.log(`Model loaded from cache: ${url}`);
      onProgress?.({ loaded: 100, total: 100, percentage: 100 });
      return cached.clone();
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(url);
    if (existingPromise) {
      console.log(`Model already loading: ${url}`);
      return existingPromise;
    }

    // Start loading
    const loadPromise = this.loadModelFromNetwork(url, onProgress);
    this.loadingPromises.set(url, loadPromise);

    try {
      const model = await loadPromise;
      this.loadingPromises.delete(url);
      return model;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  /**
   * Load model from network
   */
  private async loadModelFromNetwork(
    url: string,
    onProgress?: (progress: ModelLoadProgress) => void
  ): Promise<THREE.Object3D> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        // onLoad
        (gltf) => {
          const loadTime = performance.now() - startTime;
          const model = gltf.scene;

          // Optimize model
          const optimizedModel = this.optimizeModel(model);

          // Calculate approximate size
          const size = this.estimateModelSize(optimizedModel);

          // Cache the model
          this.cacheModel(url, optimizedModel, loadTime, size);

          console.log(`Model loaded: ${url} (${loadTime.toFixed(2)}ms, ~${(size / 1024).toFixed(2)}KB)`);

          resolve(optimizedModel.clone());
        },
        // onProgress
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress: ModelLoadProgress = {
              loaded: xhr.loaded,
              total: xhr.total,
              percentage: (xhr.loaded / xhr.total) * 100,
            };
            onProgress?.(progress);
          }
        },
        // onError
        (error) => {
          console.error(`Failed to load model: ${url}`, error);
          reject(new Error(`Failed to load model: ${error}`));
        }
      );
    });
  }

  /**
   * Optimize model for AR rendering
   */
  optimizeModel(model: THREE.Object3D): THREE.Object3D {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Enable shadow casting and receiving
        child.castShadow = true;
        child.receiveShadow = true;

        // Optimize geometry
        if (child.geometry) {
          // Compute vertex normals if not present
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }

          // Compute bounding box and sphere for frustum culling
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();
        }

        // Optimize materials
        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          
          // Enable physically correct lighting
          material.needsUpdate = true;
          
          // Optimize texture settings
          if (material.map) {
            material.map.anisotropy = 4; // Reduce from default 16
          }
        }
      }
    });

    return model;
  }

  /**
   * Simplify geometry for performance (basic implementation)
   */
  private simplifyGeometry(geometry: THREE.BufferGeometry, targetRatio: number = 0.5): THREE.BufferGeometry {
    // This is a placeholder for geometry simplification
    // In production, you might use libraries like three-mesh-bvh or simplify-modifier
    
    const vertexCount = geometry.attributes.position.count;
    const targetCount = Math.floor(vertexCount * targetRatio);

    console.log(`Geometry simplification: ${vertexCount} → ${targetCount} vertices`);

    // For now, just return the original geometry
    // TODO: Implement actual simplification algorithm
    return geometry;
  }

  /**
   * Cache a loaded model
   */
  private cacheModel(url: string, model: THREE.Object3D, loadTime: number, size: number): void {
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const removed = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        console.log(`Cache full, removed: ${firstKey}`);
        
        // Dispose of removed model
        this.disposeModel(removed!.model);
      }
    }

    // Add to cache
    this.cache.set(url, {
      url,
      model: model.clone(),
      loadTime,
      size,
    });
  }

  /**
   * Get cached model
   */
  getCachedModel(url: string): THREE.Object3D | null {
    const cached = this.cache.get(url);
    return cached ? cached.model : null;
  }

  /**
   * Check if model is cached
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Clear specific model from cache
   */
  clearCache(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      this.disposeModel(cached.model);
      this.cache.delete(url);
      console.log(`Cleared cache for: ${url}`);
    }
  }

  /**
   * Clear all cached models
   */
  clearAllCache(): void {
    this.cache.forEach((cached) => {
      this.disposeModel(cached.model);
    });
    this.cache.clear();
    console.log('Cleared all model cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    count: number;
    totalSize: number;
    models: Array<{ url: string; size: number; loadTime: number }>;
  } {
    const models: Array<{ url: string; size: number; loadTime: number }> = [];
    let totalSize = 0;

    this.cache.forEach((cached) => {
      models.push({
        url: cached.url,
        size: cached.size,
        loadTime: cached.loadTime,
      });
      totalSize += cached.size;
    });

    return {
      count: this.cache.size,
      totalSize,
      models,
    };
  }

  /**
   * Estimate model size in bytes (approximate)
   */
  private estimateModelSize(model: THREE.Object3D): number {
    let size = 0;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Estimate geometry size
        if (child.geometry) {
          const attributes = child.geometry.attributes;
          for (const key in attributes) {
            const attribute = attributes[key];
            size += attribute.array.byteLength;
          }

          // Add index buffer if present
          if (child.geometry.index) {
            size += child.geometry.index.array.byteLength;
          }
        }

        // Estimate texture size (rough approximation)
        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.map) {
            const image = material.map.image;
            if (image) {
              // Rough estimate: width * height * 4 bytes per pixel
              size += (image.width || 512) * (image.height || 512) * 4;
            }
          }
        }
      }
    });

    return size;
  }

  /**
   * Dispose of model and free memory
   */
  private disposeModel(model: THREE.Object3D): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Dispose materials and textures
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(child.material);
          }
        }
      }
    });
  }

  /**
   * Dispose of material and its textures
   */
  private disposeMaterial(material: THREE.Material): void {
    // Dispose textures
    const materialWithTextures = material as any;
    for (const key in materialWithTextures) {
      const value = materialWithTextures[key];
      if (value && value instanceof THREE.Texture) {
        value.dispose();
      }
    }

    // Dispose material
    material.dispose();
  }

  /**
   * Preload multiple models
   */
  async preloadModels(urls: string[]): Promise<void> {
    console.log(`Preloading ${urls.length} models...`);
    
    const promises = urls.map((url) => 
      this.loadModel(url).catch((error) => {
        console.error(`Failed to preload model: ${url}`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('Preloading complete');
  }

  /**
   * Check if model size is within limits
   */
  async checkModelSize(url: string): Promise<{ valid: boolean; size: number; warning?: string }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (!contentLength) {
        return { valid: true, size: 0, warning: 'Could not determine model size' };
      }

      const size = parseInt(contentLength, 10);

      if (size > this.maxModelSize) {
        return {
          valid: false,
          size,
          warning: `Model size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(this.maxModelSize / 1024 / 1024).toFixed(2)}MB)`,
        };
      }

      if (size > this.maxModelSize * 0.7) {
        return {
          valid: true,
          size,
          warning: `Model is large (${(size / 1024 / 1024).toFixed(2)}MB). Loading may take time.`,
        };
      }

      return { valid: true, size };
    } catch (error) {
      console.error('Failed to check model size:', error);
      return { valid: true, size: 0, warning: 'Could not check model size' };
    }
  }
}

// Export singleton instance
export const modelLoader = new ModelLoader();
