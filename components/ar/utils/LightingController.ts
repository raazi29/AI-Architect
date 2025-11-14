import { 
  AmbientLight, 
  DirectionalLight, 
  HemisphereLight, 
  PointLight, 
  SpotLight,
  Scene,
  Color,
  Object3D
} from 'three';

interface LightingOptions {
  enableShadows?: boolean;
  enableRealisticMode?: boolean;
  quality?: 'low' | 'medium' | 'high';
  ambientIntensity?: number;
  directionalIntensity?: number;
  hemisphereIntensity?: number;
}

export class LightingController {
  private ambientLight: AmbientLight | null = null;
  private directionalLight: DirectionalLight | null = null;
  private hemisphereLight: HemisphereLight | null = null;
  private pointLights: PointLight[] = [];
  private spotLights: SpotLight[] = [];

  setupLighting(scene: Scene, options: LightingOptions = {}) {
    const {
      enableShadows = true,
      enableRealisticMode = true,
      quality = 'medium',
      ambientIntensity = 0.5,
      directionalIntensity = 1,
      hemisphereIntensity = 0.5
    } = options;

    // Clear existing lights
    this.removeAllLights(scene);

    // Add ambient light
    this.ambientLight = new AmbientLight(0xffffff, ambientIntensity);
    scene.add(this.ambientLight);

    // Add hemisphere light for more natural lighting
    this.hemisphereLight = new HemisphereLight(0xffffbb, 0x080820, hemisphereIntensity);
    scene.add(this.hemisphereLight);

    // Add directional light (sun/simulated sunlight)
    this.directionalLight = new DirectionalLight(0xffffff, directionalIntensity);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = enableShadows;
    
    if (enableShadows) {
      // Configure shadow properties based on quality
      const shadowMapSize = this.getShadowMapSize(quality);
      this.directionalLight.shadow.mapSize.width = shadowMapSize;
      this.directionalLight.shadow.mapSize.height = shadowMapSize;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 50;
      this.directionalLight.shadow.camera.left = -10;
      this.directionalLight.shadow.camera.right = 10;
      this.directionalLight.shadow.camera.top = 10;
      this.directionalLight.shadow.camera.bottom = -10;
    }
    
    scene.add(this.directionalLight);

    // Add additional lights for realistic mode
    if (enableRealisticMode) {
      this.addRealisticLights(scene, quality);
    }
  }

  private addRealisticLights(scene: Scene, quality: 'low' | 'medium' | 'high') {
    // Add fill light
    const fillLight = new DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 8, -5);
    fillLight.castShadow = false;
    scene.add(fillLight);
    
    // Add back light
    const backLight = new DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, 4, -8);
    backLight.castShadow = false;
    scene.add(backLight);

    // Add point lights for additional illumination in realistic mode
    const pointLight1 = new PointLight(0xffe5b4, 0.5, 20);
    pointLight1.position.set(3, 5, 3);
    scene.add(pointLight1);
    this.pointLights.push(pointLight1);

    const pointLight2 = new PointLight(0xb4d8ff, 0.3, 15);
    pointLight2.position.set(-3, 4, -3);
    scene.add(pointLight2);
    this.pointLights.push(pointLight2);

    // Add a subtle spot light for accent
    if (quality !== 'low') {
      const spotLight = new SpotLight(0xffffff, 0.6, 20, Math.PI / 6, 0.5, 2);
      spotLight.position.set(0, 8, 0);
      spotLight.castShadow = true;
      scene.add(spotLight);
      this.spotLights.push(spotLight);
    }
  }

  private getShadowMapSize(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'high': return 2048;
      case 'medium': return 1024;
      case 'low': return 512;
      default: return 1024;
    }
  }

  private removeAllLights(scene: Scene) {
    // Remove existing lights
    if (this.ambientLight) {
      scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    
    if (this.directionalLight) {
      scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
    
    if (this.hemisphereLight) {
      scene.remove(this.hemisphereLight);
      this.hemisphereLight = null;
    }
    
    // Remove point lights
    for (const light of this.pointLights) {
      scene.remove(light);
    }
    this.pointLights = [];
    
    // Remove spot lights
    for (const light of this.spotLights) {
      scene.remove(light);
    }
    this.spotLights = [];
  }

  updateLighting(options: LightingOptions) {
    // This would update existing lighting based on new options
    console.log('Updating lighting with options:', options);
  }

  dispose() {
    // Clean up lights to prevent memory leaks
    if (this.ambientLight) this.ambientLight.dispose();
    if (this.directionalLight) this.directionalLight.dispose();
    if (this.hemisphereLight) this.hemisphereLight.dispose();
    
    for (const light of this.pointLights) {
      light.dispose();
    }
    
    for (const light of this.spotLights) {
      light.dispose();
    }
  }
}