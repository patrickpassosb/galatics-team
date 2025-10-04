import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactMarker() {
  const markerRef = useRef()
  const pulseRef = useRef()
  const { impact, impactOccurred, isPlaying } = useSimulationStore()

  // Animate pulsing effect
  useFrame((state) => {
    if (!markerRef.current || !pulseRef.current || !impact || impactOccurred) return
    
    const time = state.clock.getElapsedTime()
    
    // Main marker pulse
    const pulseScale = 1 + Math.sin(time * 3) * 0.3
    markerRef.current.scale.setScalar(pulseScale)
    
    // Outer ring pulse
    const pulseBig = 1 + Math.sin(time * 2) * 0.5
    pulseRef.current.scale.setScalar(pulseBig)
    pulseRef.current.material.opacity = 0.3 + Math.sin(time * 2) * 0.2
  })

  // Don't show marker if impact already occurred or simulation is playing
  if (!impact || impactOccurred || isPlaying) return null

  const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 301)

  return (
    <group position={impactPos.toArray()}>
      {/* Main marker dot */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color='#ff0000'
          emissive='#ff0000'
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Pulsing outer ring */}
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 32]} />
        <meshBasicMaterial
          color='#ff4444'
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          emissive='#ff0000'
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {/* Crosshair lines */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[8, 0.5, 0.5]} />
        <meshBasicMaterial
          color='#ff0000'
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.5, 8]} />
        <meshBasicMaterial
          color='#ff0000'
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

export default ImpactMarker
