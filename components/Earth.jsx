import React, { useRef, Suspense, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'

function EarthMesh() {
  const earthRef = useRef()
  const craterGroupRef = useRef()
  const { impactOccurred, impact } = useSimulationStore()

  // Load Earth texture
  const colorMap = useLoader(
    TextureLoader,
    'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg'
  )

  // Create crater texture
  const craterTexture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    const center = size / 2
    
    // Draw crater with radial gradient
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(10, 5, 0, 1)')      // Very dark center
    gradient.addColorStop(0.4, 'rgba(40, 20, 10, 0.9)') // Dark brown
    gradient.addColorStop(0.7, 'rgba(80, 40, 20, 0.5)') // Crater rim
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')       // Fade out
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    
    return new THREE.CanvasTexture(canvas)
  }, [])

  // Slow rotation
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
    
    // Update crater position to stay on impact location
    if (craterGroupRef.current && impactOccurred) {
      const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 300.2)
      craterGroupRef.current.position.copy(impactPos)
      craterGroupRef.current.lookAt(0, 0, 0)
    }
  })

  // Calculate crater scale
  const craterScale = useMemo(() => {
    if (!impact || !impact.craterDiameter) return 20
    return Math.max(20, (impact.craterDiameter / 1000) * 8)
  }, [impact])

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[300, 128, 128]} />
        <meshStandardMaterial
          map={colorMap}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Crater - visible after impact */}
      {impactOccurred && (
        <group ref={craterGroupRef}>
          <mesh>
            <circleGeometry args={[craterScale, 32]} />
            <meshBasicMaterial
              map={craterTexture}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

function EarthFallback() {
  const earthRef = useRef()

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <mesh ref={earthRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[300, 128, 128]} />
      <meshStandardMaterial
        color="#1e4d8b"
        emissive="#0d2847"
        emissiveIntensity={0.15}
        metalness={0.2}
        roughness={0.8}
      />
    </mesh>
  )
}

function Earth() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthMesh />
    </Suspense>
  )
}

export default Earth
