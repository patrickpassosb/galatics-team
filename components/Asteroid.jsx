import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function Asteroid() {
  const asteroidRef = useRef()
  const { asteroid, trajectory, isPlaying, currentTime } = useSimulationStore()

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
    if (!asteroidRef.current || trajectory.length === 0) return

    if (isPlaying && trajectory.length > 0) {
      const store = useSimulationStore.getState()
      const newTime = (store.currentTime + delta * store.timeScale) % 1
      store.currentTime = newTime

      // Get position from trajectory
      const index = Math.floor(newTime * (trajectory.length - 1))
      const point = trajectory[index]
      
      if (point) {
        const scale = 300 / 6371 // Convert from Earth radius scale
        asteroidRef.current.position.set(
          point.position[0] * scale,
          point.position[1] * scale,
          point.position[2] * scale
        )
      }
    } else if (trajectory.length > 0) {
      // Position at start of trajectory when paused
      const point = trajectory[0]
      const scale = 300 / 6371
      asteroidRef.current.position.set(
        point.position[0] * scale,
        point.position[1] * scale,
        point.position[2] * scale
      )
    }

    // Rotate for visual effect
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += delta * 0.5
      asteroidRef.current.rotation.y += delta * 0.3
    }
  })

  // Scale based on asteroid diameter (adjusted for Earth radius 300)
  const scale = Math.max(3, (asteroid.diameter / 1000) * 30)

  return (
    <mesh ref={asteroidRef} geometry={geometry} scale={scale}>
      <meshStandardMaterial
        color='#8B7355'
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  )
}

export default Asteroid
