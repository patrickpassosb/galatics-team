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

  // Create DRAMATIC crater texture
  const craterTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    
    const center = size / 2
    
    // Draw VERY DARK, VISIBLE crater with radial gradient
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')          // Pure black center
    gradient.addColorStop(0.3, 'rgba(20, 10, 5, 1)')      // Very dark brown
    gradient.addColorStop(0.5, 'rgba(60, 30, 15, 0.95)')  // Dark crater
    gradient.addColorStop(0.7, 'rgba(100, 50, 25, 0.7)')  // Brown rim
    gradient.addColorStop(0.85, 'rgba(140, 70, 35, 0.4)') // Ejecta
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')          // Fade out
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    
    // Add some texture/detail
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * center * 0.6
      const x = center + Math.cos(angle) * dist
      const y = center + Math.sin(angle) * dist
      const radius = Math.random() * 3 + 1
      
      ctx.fillStyle = `rgba(10, 5, 0, ${Math.random() * 0.5})`
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    return new THREE.CanvasTexture(canvas)
  }, [])

  // Slow rotation
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
    
    // Update crater position to stay on impact location
    if (craterGroupRef.current && impactOccurred && impact && typeof impact.latitude === 'number' && typeof impact.longitude === 'number') {
      const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 300.2)
      if (!isNaN(impactPos.x) && !isNaN(impactPos.y) && !isNaN(impactPos.z)) {
        craterGroupRef.current.position.copy(impactPos)
        craterGroupRef.current.lookAt(0, 0, 0)
      }
    }
  })

  // Calculate BIGGER crater scale for visibility
  const craterScale = useMemo(() => {
    if (!impact || !impact.craterDiameter) return 30
    return Math.max(30, (impact.craterDiameter / 1000) * 12)
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
      
      {/* DRAMATIC VISIBLE Crater - appears after impact */}
      {impactOccurred && (
        <group ref={craterGroupRef}>
          {/* Main crater dark spot */}
          <mesh position={[0, 0.1, 0]}>
            <circleGeometry args={[craterScale, 64]} />
            <meshBasicMaterial
              map={craterTexture}
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
          
          {/* Secondary darker center for emphasis */}
          <mesh position={[0, 0.2, 0]}>
            <circleGeometry args={[craterScale * 0.5, 32]} />
            <meshBasicMaterial
              color='#000000'
              transparent
              opacity={0.8}
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
