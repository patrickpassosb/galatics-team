import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import * as THREE from 'three'

// Smooth easing function for cinematic effect
function easeInQuad(t) {
  return t * t
}

function Asteroid() {
  const asteroidRef = useRef()
  const glowRef = useRef()
  const { asteroid, trajectory, isPlaying } = useSimulationStore()

  // Create rough asteroid geometry
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const positions = geo.attributes.position.array
    
    // Randomize vertices for rocky appearance
    for (let i = 0; i < positions.length; i += 3) {
      const noise = Math.random() * 0.3
      positions[i] *= 1 + noise
      positions[i + 1] *= 1 + noise
      positions[i + 2] *= 1 + noise
    }
    
    geo.computeVertexNormals()
    return geo
  }, [])

  // Animate asteroid along trajectory
  useFrame((state, delta) => {
    if (!asteroidRef.current || !trajectory || trajectory.length === 0) return

    const store = useSimulationStore.getState()

    if (isPlaying && trajectory.length > 0) {
      // SLOWER animation - multiply by 0.2 for cinematic slow motion
      const newTime = Math.min(1, store.currentTime + delta * store.timeScale * 0.2)
      store.currentTime = newTime

      // Apply easing for smooth acceleration
      const easedTime = easeInQuad(newTime)
      
      // Get position from trajectory
      const index = Math.floor(easedTime * (trajectory.length - 1))
      const point = trajectory[index]
      
      if (point && point.position) {
        const scale = 300 / 6371 // Convert from Earth radius scale
        const newPos = new THREE.Vector3(
          point.position[0] * scale,
          point.position[1] * scale,
          point.position[2] * scale
        )
        
        asteroidRef.current.position.copy(newPos)
        
        // Atmospheric glow effect when close to Earth
        if (glowRef.current) {
          const distToEarth = newPos.length() - 300
          if (distToEarth < 100) {
            const intensity = Math.max(0, 1 - distToEarth / 100)
            glowRef.current.material.opacity = intensity * 0.6
            glowRef.current.material.emissiveIntensity = intensity * 1.5
          } else {
            glowRef.current.material.opacity = 0
          }
        }
        
        // Check for impact
        if (newPos.length() <= 301 && !store.impactOccurred) {
          store.setImpactOccurred(true)
        }
      }
    } else if (trajectory.length > 0) {
      // Position at start when paused
      const point = trajectory[0]
      if (point && point.position) {
        const scale = 300 / 6371
        asteroidRef.current.position.set(
          point.position[0] * scale,
          point.position[1] * scale,
          point.position[2] * scale
        )
      }
    }

    // Rotate for visual effect
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += delta * 0.5
      asteroidRef.current.rotation.y += delta * 0.3
    }
  })

  // Scale based on asteroid diameter
  const scale = Math.max(3, (asteroid.diameter / 1000) * 30)

  return (
    <group>
      {/* Main asteroid */}
      <mesh ref={asteroidRef} geometry={geometry} scale={scale}>
        <meshStandardMaterial
          color='#8B7355'
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Atmospheric glow */}
      <mesh ref={glowRef} geometry={geometry} scale={scale * 1.4}>
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0}
          emissive='#ff4400'
          emissiveIntensity={0}
        />
      </mesh>
    </group>
  )
}

export default Asteroid
