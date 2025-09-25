"use client"

import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { ARButton } from "three/examples/jsm/webxr/ARButton.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"

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
    model?: THREE.Object3D // Reference to the loaded 3D model
}
  
interface ThreeSceneProps {
    selectedFurniture: FurnitureItem | null
    onPlaceItem: (item: PlacedItem) => void
    placedItems: PlacedItem[]
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ selectedFurniture, onPlaceItem, placedItems }) => {
    const mountRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const reticleRef = useRef<THREE.Mesh | null>(null)
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null)
    const gltfLoaderRef = useRef<GLTFLoader | null>(null)
    const modelCacheRef = useRef<Map<number, THREE.Object3D>>(new Map())
    const controllerRef = useRef<THREE.Group | null>(null)
  
    const [isAR, setIsAR] = useState(false)
    const [isARSupported, setIsARSupported] = useState(false)
    const [loadingModel, setLoadingModel] = useState(false)
    const [arStatus, setArStatus] = useState<string>('Checking AR support...')
  
    useEffect(() => {
      if (!mountRef.current || !isAR) return
  
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
      rendererRef.current = renderer
  
      mountRef.current.appendChild(renderer.domElement)
  
      // AR Button
      const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
      })
      document.body.appendChild(arButton)
  
      // Light
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
      light.position.set(0.5, 1, 0.25)
      scene.add(light)
  
      // Reticle
      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
      )
      reticle.matrixAutoUpdate = false
      reticle.visible = false
      scene.add(reticle)
      reticleRef.current = reticle
  
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
  
      const session = renderer.xr.getSession()
      if (session) {
        session.requestReferenceSpace("local").then((referenceSpace) => {
          session.requestHitTestSource?.({ space: referenceSpace }).then((source) => {
            hitTestSourceRef.current = source
          })
        })
  
        session.addEventListener("end", () => {
          hitTestSourceRef.current = null
        })
      }
  
      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
  
      window.addEventListener("resize", handleResize)
  
      return () => {
        window.removeEventListener("resize", handleResize)
        if (mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
        document.body.removeChild(arButton)
        renderer.dispose()
      }
    }, [isAR])
  
    useEffect(() => {
      const scene = sceneRef.current
      if (!scene) return
  
      // Clear existing objects
      while (scene.children.length > 2) {
        scene.remove(scene.children[2])
      }
  
      // Add placed items
      placedItems.forEach((item) => {
        const geometry = new THREE.BoxGeometry(
          item.scale.x,
          item.scale.y,
          item.scale.z
        )
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(item.position.x, item.position.y, item.position.z)
        mesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
        scene.add(mesh)
      })
    }, [placedItems])
  
    const handlePlaceItem = () => {
      if (selectedFurniture && reticleRef.current?.visible) {
        const position = new THREE.Vector3()
        reticleRef.current.getWorldPosition(position)
  
        const newItem: PlacedItem = {
          id: `${selectedFurniture.id}-${Date.now()}`,
          furnitureId: selectedFurniture.id,
          position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: {
            x: selectedFurniture.dimensions.width / 100,
            y: selectedFurniture.dimensions.height / 100,
            z: selectedFurniture.dimensions.depth / 100,
          },
        }
        onPlaceItem(newItem)
      }
    }
  
    return (
      <div ref={mountRef} onClick={handlePlaceItem} onTouchStart={() => setIsAR(true)} style={{ width: "100%", height: "100%" }}>
        {!isAR && (
          <div className="flex items-center justify-center w-full h-full">
            <button onClick={() => setIsAR(true)} className="p-4 bg-blue-500 text-white rounded">
              Start AR
            </button>
          </div>
        )}
      </div>
    )
}

export default ThreeScene
