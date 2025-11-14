import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export interface ModelLoadConfig {
  url: string;
  dracoEnabled?: boolean;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
  timeout?: number;
}

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  bbox: THREE.Box3;
  size: THREE.Vector3;
  center: THREE.Vector3;
}

export class ModelLoader {
  private static instance: ModelLoader;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private cache: Map<string, LoadedModel>;
  private loadingPromises: Map<string, Promise<LoadedModel>>;

  private constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    
    // Initialize GLTF loader
    this.gltfLoader = new GLTFLoader();
    
    // Initialize DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  public async loadModel(config: ModelLoadConfig): Promise<LoadedModel> {
    const { url, dracoEnabled = true, onProgress, maxRetries = 3, timeout = 30000 } = config;
    
    // Check cache first
    if (this.cache.has(url)) {
      console.log(`ModelLoader: Returning cached model for ${url}`);
      return this.cache.get(url)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      console.log(`ModelLoader: Returning existing promise for ${url}`);
      return this.loadingPromises.get(url)!;
    }

    // Create new loading promise
    const loadingPromise = this.loadModelInternal(url, dracoEnabled, onProgress, maxRetries, timeout);
    this.loadingPromises.set(url, loadingPromise);

    try {
      const result = await loadingPromise;
      this.cache.set(url, result);
      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private async loadModelInternal(
    url: string, 
    dracoEnabled: boolean, 
    onProgress?: (progress: number) => void,
    maxRetries: number = 3,
    timeout: number = 30000
  ): Promise<LoadedModel> {
    console.log(`ModelLoader: Loading model from ${url}`);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = await this.loadWithTimeout(url, dracoEnabled, onProgress, timeout);
        console.log(`ModelLoader: Successfully loaded model from ${url} on attempt ${attempt}`);
        return model;
      } catch (error) {
        lastError = error as Error;
        console.warn(`ModelLoader: Attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this.delay(delay);
        }
      }
    }
    
    throw new Error(`Failed to load model after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private loadWithTimeout(
    url: string, 
    dracoEnabled: boolean, 
    onProgress?: (progress: number) => void,
    timeout: number = 30000
  ): Promise<LoadedModel> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Model loading timed out after ${timeout}ms`));
      }, timeout);

      const onLoad = (gltf: any) => {
        clearTimeout(timeoutId);
        
        try {
          const scene = gltf.scene;
          const animations = gltf.animations || [];
          
          // Compute bounding box
          const bbox = new THREE.Box3().setFromObject(scene);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());
          
          console.log(`ModelLoader: Model loaded with size:`, size, `center:`, center);
          
          const result: LoadedModel = {
            scene,
            animations,
            bbox,
            size,
            center
          };
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      const onError = (error: ErrorEvent) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load model: ${error.message}`));
      };

      // Configure DRACO if enabled
      if (dracoEnabled) {
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
      } else {
        this.gltfLoader.setDRACOLoader(null as any);
      }

      this.gltfLoader.load(url, onLoad, onProgress, onError);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      console.log(`ModelLoader: Cleared cache for ${url}`);
    } else {
      this.cache.clear();
      console.log('ModelLoader: Cleared all cache');
    }
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public getCachedUrls(): string[] {
    return Array.from(this.cache.keys());
  }

  public dispose(): void {
    this.clearCache();
    this.dracoLoader.dispose();
    console.log('ModelLoader: Disposed all resources');
  }
}

// Export singleton instance
export const modelLoader = ModelLoader.getInstance();