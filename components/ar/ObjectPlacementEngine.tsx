import * as THREE from 'three';
import { PlacedObject, ObjectTransform } from '@/lib/types/ar';
import { modelLoader } from './utils/ModelLoader';

/**
 * ObjectPlacementEngine Class
 * 
 * Manages 3D object placement, manipulation, and anchoring in AR.
 * Handles multiple objects, selection, and environmental lighting.
 */
export class ObjectPlacementEngine {
  private scene: THREE.Scene;
  private placedObjects: Map<string, PlacedObject>;
  private selectedObjectId: string | null = null;
  private xrSession: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private objectCounter: number = 0;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private lightProbe: THREE.LightProbe | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.placedObjects = new Map();
    
    // Set up default lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 7.5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(this.directionalLight);
  }

  /**
   * Set XR session and reference space
   */
  setXRSession(session: XRSession, refSpace: XRReferenceSpace): void {
    this.xrSession = session;
    this.referenceSpace = refSpace;
  }

  /**
   * Place object at hit test result position
   */
  async placeObject(
    modelUrl: string,
    hitResult: XRHitTestResult,
    modelScale: number = 1.0
  ): Promise<string> {
    if (!this.referenceSpace) {
      throw new Error('Reference space not set');
    }

    try {
      // Load model
      const loadedModel = await modelLoader.loadModel({
        url: modelUrl,
        dracoEnabled: true,
        maxRetries: 3,
        timeout: 30000,
      });
      
      const model = loadedModel.scene;

      // Get pose from hit test result
      const pose = hitResult.getPose(this.referenceSpace);
      if (!pose) {
        throw new Error('Failed to get pose from hit test result');
      }

      // Create unique ID
      const objectId = `object_${++this.objectCounter}_${Date.now()}`;

      // Extract transform from pose
      const matrix = new THREE.Matrix4();
      matrix.fromArray(pose.transform.matrix);

      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      matrix.decompose(position, rotation, scale);

      // Apply model scale
      model.scale.set(modelScale, modelScale, modelScale);

      // Set model position and rotation
      model.position.copy(position);
      model.quaternion.copy(rotation);

      // Add model to scene
      this.scene.add(model);

      // Create anchor if supported
      let anchor: XRAnchor | null = null;
      if (this.xrSession && 'createAnchor' in hitResult) {
        try {
          anchor = await (hitResult as any).createAnchor();
          console.log('Anchor created for object:', objectId);
        } catch (error) {
          console.warn('Failed to create anchor:', error);
        }
      }

      // Store placed object
      const placedObject: PlacedObject = {
        id: objectId,
        modelUrl,
        modelName: this.getModelName(modelUrl),
        anchor: anchor ? {
          position: [position.x, position.y, position.z],
          rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
        } : null,
        transform: {
          position: position.clone(),
          rotation: new THREE.Euler().setFromQuaternion(rotation),
          scale: new THREE.Vector3(modelScale, modelScale, modelScale),
        },
        timestamp: new Date(),
        isSelected: false,
        mesh: model,
      };

      this.placedObjects.set(objectId, placedObject);

      console.log(`Object placed: ${objectId} at`, position);

      return objectId;
    } catch (error) {
      console.error('Failed to place object:', error);
      throw error;
    }
  }

  /**
   * Select an object
   */
  selectObject(objectId: string): void {
    // Deselect previous object
    if (this.selectedObjectId) {
      const prevObject = this.placedObjects.get(this.selectedObjectId);
      if (prevObject) {
        prevObject.isSelected = false;
        this.removeSelectionHighlight(prevObject.mesh!);
      }
    }

    // Select new object
    const object = this.placedObjects.get(objectId);
    if (object) {
      object.isSelected = true;
      this.selectedObjectId = objectId;
      this.addSelectionHighlight(object.mesh!);
      console.log('Object selected:', objectId);
    }
  }

  /**
   * Deselect current object
   */
  deselectObject(): void {
    if (this.selectedObjectId) {
      const object = this.placedObjects.get(this.selectedObjectId);
      if (object) {
        object.isSelected = false;
        this.removeSelectionHighlight(object.mesh!);
      }
      this.selectedObjectId = null;
    }
  }

  /**
   * Move object to new position
   */
  moveObject(objectId: string, newPosition: THREE.Vector3): void {
    const object = this.placedObjects.get(objectId);
    if (!object || !object.mesh) return;

    object.mesh.position.copy(newPosition);
    object.transform.position.copy(newPosition);

    // Update anchor data
    if (object.anchor) {
      object.anchor.position = [newPosition.x, newPosition.y, newPosition.z];
    }

    console.log(`Object moved: ${objectId} to`, newPosition);
  }

  /**
   * Rotate object
   */
  rotateObject(objectId: string, rotation: number): void {
    const object = this.placedObjects.get(objectId);
    if (!object || !object.mesh) return;

    object.mesh.rotateY(rotation);
    object.transform.rotation.setFromQuaternion(object.mesh.quaternion);

    console.log(`Object rotated: ${objectId} by ${rotation} radians`);
  }

  /**
   * Scale object
   */
  scaleObject(objectId: string, scaleFactor: number): void {
    const object = this.placedObjects.get(objectId);
    if (!object || !object.mesh) return;

    // Clamp scale between 0.1 and 10
    const clampedScale = Math.max(0.1, Math.min(10, scaleFactor));

    object.mesh.scale.multiplyScalar(clampedScale);
    object.transform.scale.multiplyScalar(clampedScale);

    console.log(`Object scaled: ${objectId} by ${clampedScale}`);
  }

  /**
   * Remove object
   */
  removeObject(objectId: string): void {
    const object = this.placedObjects.get(objectId);
    if (!object) return;

    // Remove from scene
    if (object.mesh) {
      this.scene.remove(object.mesh);
    }

    // Delete anchor if exists
    if (object.anchor && this.xrSession) {
      // Note: XRAnchor deletion is handled by the session
    }

    // Remove from map
    this.placedObjects.delete(objectId);

    // Deselect if this was selected
    if (this.selectedObjectId === objectId) {
      this.selectedObjectId = null;
    }

    console.log('Object removed:', objectId);
  }

  /**
   * Remove all objects
   */
  removeAllObjects(): void {
    this.placedObjects.forEach((object) => {
      if (object.mesh) {
        this.scene.remove(object.mesh);
      }
    });

    this.placedObjects.clear();
    this.selectedObjectId = null;

    console.log('All objects removed');
  }

  /**
   * Get object by ID
   */
  getObject(objectId: string): PlacedObject | undefined {
    return this.placedObjects.get(objectId);
  }

  /**
   * Get all placed objects
   */
  getAllObjects(): PlacedObject[] {
    return Array.from(this.placedObjects.values());
  }

  /**
   * Get selected object
   */
  getSelectedObject(): PlacedObject | null {
    if (!this.selectedObjectId) return null;
    return this.placedObjects.get(this.selectedObjectId) || null;
  }

  /**
   * Get object count
   */
  getObjectCount(): number {
    return this.placedObjects.size;
  }

  /**
   * Raycast to detect object at screen position
   */
  getObjectAtPosition(screenPosition: THREE.Vector2, camera: THREE.Camera): string | null {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenPosition, camera);

    const meshes = Array.from(this.placedObjects.values())
      .map((obj) => obj.mesh)
      .filter((mesh): mesh is THREE.Object3D => mesh !== undefined);

    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Find which object was hit
      const hitMesh = intersects[0].object;
      for (const [id, obj] of this.placedObjects.entries()) {
        if (obj.mesh && (obj.mesh === hitMesh || obj.mesh.getObjectById(hitMesh.id))) {
          return id;
        }
      }
    }

    return null;
  }

  /**
   * Add selection highlight to object
   */
  private addSelectionHighlight(mesh: THREE.Object3D): void {
    // Add outline effect (simplified version)
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissive.setHex(0x00ff00);
          material.emissiveIntensity = 0.3;
        }
      }
    });
  }

  /**
   * Remove selection highlight from object
   */
  private removeSelectionHighlight(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.emissive) {
          material.emissive.setHex(0x000000);
          material.emissiveIntensity = 0;
        }
      }
    });
  }

  /**
   * Update environmental lighting
   */
  updateEnvironmentalLighting(lightEstimate?: any): void {
    if (lightEstimate) {
      // Use XR light estimation if available
      const intensity = lightEstimate.primaryLightIntensity;
      if (intensity) {
        this.directionalLight.intensity = intensity.w;
        this.directionalLight.color.setRGB(intensity.x, intensity.y, intensity.z);
      }

      const direction = lightEstimate.primaryLightDirection;
      if (direction) {
        this.directionalLight.position.set(direction.x, direction.y, direction.z);
      }
    }
  }

  /**
   * Update anchors (call in animation loop)
   */
  updateAnchors(frame: XRFrame): void {
    if (!this.referenceSpace) return;

    this.placedObjects.forEach((object) => {
      if (object.anchor && object.mesh) {
        // In a real implementation, you would update object position based on anchor
        // This is a simplified version
        // const anchorPose = frame.getPose(object.anchor.anchorSpace, this.referenceSpace);
        // if (anchorPose) {
        //   object.mesh.matrix.fromArray(anchorPose.transform.matrix);
        // }
      }
    });
  }

  /**
   * Get model name from URL
   */
  private getModelName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(glb|gltf)$/i, '');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.removeAllObjects();
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.directionalLight);
    
    if (this.lightProbe) {
      this.scene.remove(this.lightProbe);
    }

    this.xrSession = null;
    this.referenceSpace = null;
  }
}

export default ObjectPlacementEngine;
