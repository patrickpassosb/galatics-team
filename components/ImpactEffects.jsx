import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactEffects() {
  const groupRef = useRef()
  const lightRef = useRef()
  const shockwaveRef = useRef()
  const fireballRef = useRef()
  const debrisRefs = useRef([])
  const smokeRefs = useRef([])
  
  const [effectTime, setEffectTime] = useState(0)
  const [active, setActive] = useState(false)
  
  const { impactOccurred, impact } = useSimulationStore()

  // Create debris particles
  const debrisParticles = useMemo(() => {
    const particles = []
    for (let i = 0; i < 60; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4 // Cone upward
      const speed = 10 + Math.random() * 20
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 5, // Bias upward
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: 2 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5
      })
    }
    return particles
  }, [])

  // Create smoke particles
  const smokeParticles = useMemo(() => {
    const particles = []
    for (let i = 0; i < 30; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.3
      const speed = 5 + Math.random() * 10
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 8,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: 5 + Math.random() * 8
      })
    }
    return particles
  }, [])

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
    
    // Position and orient the group to point outward from Earth
    if (groupRef.current && impact && typeof impact.latitude === 'number' && typeof impact.longitude === 'number') {
      const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 301)
      if (!isNaN(impactPos.x) && !isNaN(impactPos.y) && !isNaN(impactPos.z)) {
        groupRef.current.position.copy(impactPos)
        groupRef.current.lookAt(0, 0, 0)
      }
    }
    
    // MEGA BRIGHT light flash
    if (lightRef.current) {
      const flashDuration = 0.8
      const intensity = Math.max(0, 1 - effectTime / flashDuration)
      lightRef.current.intensity = intensity * 200
    }
    
    // Massive expanding fireball
    if (fireballRef.current) {
      const duration = 2.0
      const progress = Math.min(1, effectTime / duration)
      const scale = 8 + progress * 60
      const opacity = Math.max(0, (1 - progress) * 0.95)
      
      fireballRef.current.scale.setScalar(scale)
      fireballRef.current.material.opacity = opacity
    }
    
    // Multiple expanding shockwaves
    if (shockwaveRef.current) {
      const duration = 3.0
      const progress = Math.min(1, effectTime / duration)
      const scale = 5 + progress * 80
      const opacity = Math.max(0, (1 - progress) * 0.7)
      
      shockwaveRef.current.scale.set(scale, scale, 1)
      shockwaveRef.current.material.opacity = opacity
    }
    
    // Animate debris particles
    debrisParticles.forEach((particle, i) => {
      if (effectTime < 3) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y -= delta * 8 // Gravity
        particle.velocity.multiplyScalar(0.98) // Air resistance
        particle.rotation += particle.rotationSpeed * delta
        
        if (debrisRefs.current[i]) {
          debrisRefs.current[i].position.copy(particle.position)
          debrisRefs.current[i].rotation.z = particle.rotation
          const life = 1 - (effectTime / 3)
          debrisRefs.current[i].scale.setScalar(particle.size * life)
          debrisRefs.current[i].material.opacity = life * 0.9
        }
      }
    })
    
    // Animate smoke particles
    smokeParticles.forEach((particle, i) => {
      if (effectTime < 4) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y += delta * 3 // Smoke rises
        particle.velocity.multiplyScalar(0.97)
        
        if (smokeRefs.current[i]) {
          smokeRefs.current[i].position.copy(particle.position)
          const life = 1 - (effectTime / 4)
          const scale = particle.size * (1.5 - life * 0.5) // Expands
          smokeRefs.current[i].scale.setScalar(scale)
          smokeRefs.current[i].material.opacity = life * 0.7
        }
      }
    })
  })

  if (!impactOccurred || !impact) return null

  return (
    <group ref={groupRef}>
      {/* MEGA BRIGHT Light flash */}
      <pointLight
        ref={lightRef}
        color='#ffcc00'
        intensity={0}
        distance={600}
        decay={1.5}
      />
      
      {/* MASSIVE Fireball */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color='#ff4400'
          transparent
          opacity={0.95}
          emissive='#ff2200'
          emissiveIntensity={3}
        />
      </mesh>
      
      {/* Expanding shockwave ring on surface */}
      <mesh ref={shockwaveRef}>
        <ringGeometry args={[8, 12, 64]} />
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          emissive='#ff3300'
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Flying debris particles (rocks, dust) */}
      {debrisParticles.map((particle, i) => (
        <mesh
          key={`debris-${i}`}
          ref={el => debrisRefs.current[i] = el}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? '#ff6600' : '#cc4400'}
            transparent
            opacity={0.9}
            emissive='#ff4400'
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      
      {/* Smoke/dust cloud */}
      {smokeParticles.map((particle, i) => (
        <mesh
          key={`smoke-${i}`}
          ref={el => smokeRefs.current[i] = el}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color='#444444'
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

export default ImpactEffects

