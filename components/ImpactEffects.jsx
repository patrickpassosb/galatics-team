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
  
  const { impactOccurred, impact, asteroid } = useSimulationStore()

  // 🔬 PHYSICS-BASED EXPLOSION SCALING
  const impactPhysics = useMemo(() => {
    const velocity = asteroid.velocity || 20 // km/s
    const diameter = asteroid.diameter || 100 // meters
    const density = asteroid.density || 2600 // kg/m³
    
    // Calculate impact energy: E = v × d × ρ (simplified)
    const impactEnergy = velocity * diameter * density
    
    // Scale explosion using cube root for realistic proportions
    const explosionScale = Math.cbrt(impactEnergy) / 80
    
    return {
      scale: Math.max(0.8, Math.min(explosionScale, 4)), // Clamp for performance
      lightIntensity: Math.max(150, explosionScale * 100),
      particleCount: Math.max(50, Math.min(Math.floor(explosionScale * 35), 120)),
      shockwaveSize: Math.max(60, explosionScale * 50),
      fireballSize: Math.max(40, explosionScale * 35)
    }
  }, [asteroid.velocity, asteroid.diameter, asteroid.density])

  // 🪨 DEBRIS PARTICLES (scaled by physics)
  const debrisParticles = useMemo(() => {
    const particles = []
    const count = impactPhysics.particleCount
    const speedMult = impactPhysics.scale
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4 // Cone upward
      const speed = (10 + Math.random() * 20) * speedMult
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 5 * speedMult,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: (2 + Math.random() * 3) * impactPhysics.scale,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5
      })
    }
    return particles
  }, [impactPhysics])

  // ☁️ SMOKE PARTICLES (scaled by physics)
  const smokeParticles = useMemo(() => {
    const particles = []
    const count = Math.floor(impactPhysics.particleCount * 0.5)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.3
      const speed = (5 + Math.random() * 10) * impactPhysics.scale
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 8,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: (5 + Math.random() * 8) * impactPhysics.scale
      })
    }
    return particles
  }, [impactPhysics])

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
    
    // 💡 BLINDING LIGHT FLASH (scaled by physics)
    if (lightRef.current) {
      const flashDuration = 0.8
      const intensity = Math.max(0, 1 - effectTime / flashDuration)
      lightRef.current.intensity = intensity * impactPhysics.lightIntensity
    }
    
    // 🔥 MASSIVE FIREBALL (scaled by physics)
    if (fireballRef.current) {
      const duration = 2.0
      const progress = Math.min(1, effectTime / duration)
      const scale = 8 + progress * impactPhysics.fireballSize
      const opacity = Math.max(0, (1 - progress) * 0.95)
      
      fireballRef.current.scale.setScalar(scale)
      fireballRef.current.material.opacity = opacity
    }
    
    // 💥 EXPANDING SHOCKWAVE (scaled by physics)
    if (shockwaveRef.current) {
      const duration = 3.0
      const progress = Math.min(1, effectTime / duration)
      const scale = 5 + progress * impactPhysics.shockwaveSize
      const opacity = Math.max(0, (1 - progress) * 0.7)
      
      shockwaveRef.current.scale.set(scale, scale, 1)
      shockwaveRef.current.material.opacity = opacity
    }
    
    // 🪨 DEBRIS with PHYSICS (gravity + air resistance)
    debrisParticles.forEach((particle, i) => {
      if (effectTime < 6) { // 6-second lifetime
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y -= delta * 8 // Gravity
        particle.velocity.multiplyScalar(0.98) // Air resistance
        particle.rotation += particle.rotationSpeed * delta
        
        if (debrisRefs.current[i]) {
          debrisRefs.current[i].position.copy(particle.position)
          debrisRefs.current[i].rotation.z = particle.rotation
          const life = 1 - (effectTime / 6)
          debrisRefs.current[i].scale.setScalar(particle.size * life)
          debrisRefs.current[i].material.opacity = life * 0.9
        }
      }
    })
    
    // ☁️ SMOKE RISES & EXPANDS
    smokeParticles.forEach((particle, i) => {
      if (effectTime < 8) { // 8-second smoke lifetime
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y += delta * 3 // Smoke rises
        particle.velocity.multiplyScalar(0.97)
        
        if (smokeRefs.current[i]) {
          smokeRefs.current[i].position.copy(particle.position)
          const life = 1 - (effectTime / 8)
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
      {/* 💡 MEGA BRIGHT Light flash */}
      <pointLight
        ref={lightRef}
        color='#ffcc00'
        intensity={0}
        distance={600}
        decay={1.5}
      />
      
      {/* 🔥 MASSIVE Fireball */}
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
      
      {/* 💥 Expanding shockwave ring on surface */}
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
      
      {/* 🪨 Flying debris particles (rocks, dust) */}
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
      
      {/* ☁️ Smoke/dust cloud */}
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