import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactEffects() {
  const lightRef = useRef()
  const shockwaveRef = useRef()
  const fireballRef = useRef()
  const [effectTime, setEffectTime] = useState(0)
  const [active, setActive] = useState(false)
  
  const { impactOccurred, impact } = useSimulationStore()

  // Activate effects when impact occurs
  useEffect(() => {
    if (impactOccurred && !active) {
      setActive(true)
      setEffectTime(0)
    }
  }, [impactOccurred, active])

  // Animate effects
  useFrame((state, delta) => {
    if (!active) return
    
    setEffectTime(prev => prev + delta)
    
    // Light flash (bright flash that quickly fades)
    if (lightRef.current) {
      const flashDuration = 0.5
      const intensity = Math.max(0, 1 - effectTime / flashDuration)
      lightRef.current.intensity = intensity * 100
    }
    
    // Shockwave ring (expands and fades)
    if (shockwaveRef.current) {
      const duration = 2.0
      const progress = Math.min(1, effectTime / duration)
      const scale = 1 + progress * 50
      const opacity = (1 - progress) * 0.8
      
      shockwaveRef.current.scale.setScalar(scale)
      if (shockwaveRef.current.material) {
        shockwaveRef.current.material.opacity = opacity
      }
    }
    
    // Fireball (expands and fades)
    if (fireballRef.current) {
      const duration = 1.5
      const progress = Math.min(1, effectTime / duration)
      const scale = 5 + progress * 30
      const opacity = (1 - progress) * 0.9
      
      fireballRef.current.scale.setScalar(scale)
      if (fireballRef.current.material) {
        fireballRef.current.material.opacity = opacity
      }
    }
  })

  if (!impactOccurred || !impact) return null

  const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 301)

  return (
    <group position={impactPos.toArray()}>
      {/* Light flash */}
      <pointLight
        ref={lightRef}
        color='#ffaa00'
        intensity={0}
        distance={500}
        decay={2}
      />
      
      {/* Expanding fireball */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0.9}
          emissive='#ff3300'
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Shockwave ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 7, 32]} />
        <meshBasicMaterial
          color='#ff8800'
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          emissive='#ff4400'
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  )
}

export default ImpactEffects

