import React, { useRef, Suspense, useMemo, useEffect, useState } from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'

// Custom hook for loading Earth texture with error handling
function useEarthTexture() {
  const [texture, setTexture] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadTexture = async () => {
      try {
        const loader = new TextureLoader()
        const loadedTexture = await new Promise((resolve, reject) => {
          loader.load(
            'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg',
            resolve,
            undefined,
            reject
          )
        })
        setTexture(loadedTexture)
      } catch (err) {
        console.warn('Failed to load Earth texture, using fallback:', err)
        setError(true)
      }
    }

    loadTexture()
  }, [])

  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    // Create a simple blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 256)
    gradient.addColorStop(0, '#1e40af') // Blue
    gradient.addColorStop(0.5, '#0f172a') // Dark blue
    gradient.addColorStop(1, '#1e40af') // Blue

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 256)

    return new THREE.CanvasTexture(canvas)
  }, [])

  return error || !texture ? fallbackTexture : texture
}

// Convert 3D point on Earth to latitude/longitude
function cartesianToLatLon(x, y, z) {
  const radius = Math.sqrt(x * x + y * y + z * z)
  const lat = 90 - (Math.acos(y / radius) * 180 / Math.PI)
  const lon = (Math.atan2(z, -x) * 180 / Math.PI) - 180
  return { lat, lon }
}

function EarthMesh() {
  const earthRef = useRef()
  const craterGroupRef = useRef()
  const { impactOccurred, impact, isPlaying, setImpactLocation, calculateImpact, updateTrajectory } = useSimulationStore()
  const { gl } = useThree() // Get gl context for cursor changes

  // Use the custom hook for Earth texture with error handling
  const colorMap = useEarthTexture()

  // Create fallback Earth texture (for use in crater texture if needed)
  const fallbackTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    // Create a simple blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 256)
    gradient.addColorStop(0, '#1e40af') // Blue
    gradient.addColorStop(0.5, '#0f172a') // Dark blue
    gradient.addColorStop(1, '#1e40af') // Blue

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 256)

    return new THREE.CanvasTexture(canvas)
  }, [])

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

  // 🎯 Handle click on Earth to set impact location
  const handleEarthClick = (event) => {
    
    event.stopPropagation()
    
    // Get the intersection point
    if (event.intersections && event.intersections.length > 0) {
      const intersection = event.intersections[0]
      const point = intersection.point
      
      // IMPORTANT: Earth is at [0, 100, 0] with rotation [0, 5.6, 0]
      // Adjust click point relative to Earth's center
      const EARTH_Y_OFFSET = 100
      const EARTH_ROTATION_Y = 5.6
      
      // Subtract Earth's position
      const relativeX = point.x - 0
      const relativeY = point.y - EARTH_Y_OFFSET
      const relativeZ = point.z - 0

      // Convert to lat/lon (use relative coordinates directly)
      const { lat, lon } = cartesianToLatLon(relativeX, relativeY, relativeZ)
      
      console.log('Click at lat:', lat.toFixed(2), 'lon:', lon.toFixed(2)) // Debug
      
      // Update impact location
      setImpactLocation(lat, lon)
      
      // Recalculate trajectory for new location
      calculateImpact()
      updateTrajectory()
    }
  }

  // Update crater position when impact location changes
  React.useEffect(() => {
    if (craterGroupRef.current && impact && typeof impact.latitude === 'number' && typeof impact.longitude === 'number') {
      const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 300.2)
      if (!isNaN(impactPos.x) && !isNaN(impactPos.y) && !isNaN(impactPos.z)) {
        craterGroupRef.current.position.copy(impactPos)
        craterGroupRef.current.lookAt(0, 0, 0)
      }
    }
  }, [impact.latitude, impact.longitude])

  // Calculate BIGGER crater scale for visibility
  const craterScale = useMemo(() => {
    if (!impact || !impact.craterDiameter) return 30
    return Math.max(30, (impact.craterDiameter / 1000) * 12)
  }, [impact])

  return (
    <group>
      {/* Earth sphere - CLICKABLE with cursor feedback */}
      <mesh 
        ref={earthRef} 
        position={[0, 100, 0]}
        rotation={[0, 5.6, 0]}
        castShadow 
        receiveShadow
        onClick={handleEarthClick}
        onPointerOver={() => !isPlaying && (gl.domElement.style.cursor = 'crosshair')}
        onPointerOut={() => gl.domElement.style.cursor = 'auto'}
      >
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

  // 🛑 EARTH ROTATION DISABLED for better visibility
  // useFrame((state, delta) => {
  //   if (earthRef.current) {
  //     earthRef.current.rotation.y += delta * 0.05
  //   }
  // })

  return (
    <mesh ref={earthRef} position={[0, 100, 0]} rotation={[0, 5.6, 0]} castShadow receiveShadow>
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