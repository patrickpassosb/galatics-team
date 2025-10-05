import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import * as THREE from 'three'

// 🎬 CINEMATIC EASING: Smooth acceleration toward Earth
function easeInCubic(t) {
  return t * t * t // Cubic easing for dramatic acceleration
}


function Asteroid() {
  const asteroidRef = useRef()
  console.log("Passou")
  const glowRef = useRef()
  const trailParticlesRef = useRef([])
  const { asteroid, trajectory, isPlaying } = useSimulationStore()

  // Create rough rocky asteroid geometry
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

  // 🔥 BURNING TRAIL PARTICLES (pool for performance)
  const trailParticles = useMemo(() => {
    const particles = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.0,
        size: 1 + Math.random() * 2
      })
    }
    return particles
  }, [])

  // 🚀 ANIMATE ASTEROID - EXACTLY 3 SECONDS TO IMPACT
  useFrame((state, delta) => {
    if (!asteroidRef.current || !trajectory || trajectory.length === 0) return

    const store = useSimulationStore.getState()

    if (isPlaying && trajectory.length > 0) {
      // ⏱️ EXACT 3-SECOND TIMING
      const IMPACT_DURATION = 3.0 // seconds
      const newTime = Math.min(IMPACT_DURATION, store.currentTime + delta)
      store.currentTime = newTime

      // Normalize to 0-1 range
      const normalizedTime = newTime / IMPACT_DURATION
      
      // 🎬 Apply cubic easing for smooth acceleration
      const easedTime = easeInCubic(normalizedTime)
      
      // Get position from trajectory
      const index = Math.floor(easedTime * (trajectory.length - 1))
      const point = trajectory[index]
      
      if (point && point.position && Array.isArray(point.position) && point.position.length === 3) {
        const scale = 300 / 6371
        const newPos = new THREE.Vector3(
          point.position[0] * scale,
          point.position[1] * scale,
          point.position[2] * scale
        )
        
        if (!isNaN(newPos.x) && !isNaN(newPos.y) && !isNaN(newPos.z)) {
          asteroidRef.current.position.copy(newPos)
          
          const distToEarth = newPos.length() - 300
          const atmosphereHeight = 150 // Start effects at 150 units
          
          // 🔥 ATMOSPHERIC GLOW (intensifies as asteroid approaches)
          if (glowRef.current && distToEarth < atmosphereHeight) {
            const intensity = Math.max(0, 1 - distToEarth / atmosphereHeight)
            glowRef.current.material.opacity = intensity * 0.8
            glowRef.current.material.emissiveIntensity = intensity * 3
          } else if (glowRef.current) {
            glowRef.current.material.opacity = 0
          }
          
          // 🔥 SPAWN BURNING TRAIL PARTICLES (in atmosphere only)
          if (distToEarth < atmosphereHeight && Math.random() > 0.4) {
            const deadParticle = trailParticles.find(p => p.life <= 0)
            if (deadParticle) {
              deadParticle.position.copy(newPos)
              deadParticle.velocity.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
              )
              deadParticle.life = deadParticle.maxLife
            }
          }
          
          // ✅ DETECT IMPACT (more generous threshold)
          if (distToEarth <= 5 && !store.impactOccurred) {
            store.setImpactOccurred(true)
          }
          
          // ✅ FORCE IMPACT at end of animation
          if (normalizedTime >= 0.99 && !store.impactOccurred) {
            store.setImpactOccurred(true)
          }
        }
      }
    } else if (trajectory.length > 0 && !isPlaying) {
      // Reset to start position when paused
      const point = trajectory[0]
      if (point && point.position && Array.isArray(point.position) && point.position.length === 3) {
        const scale = 300 / 6371
        const x = point.position[0] * scale
        const y = point.position[1] * scale
        const z = point.position[2] * scale
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          asteroidRef.current.position.set(x, y, z)
        }
      }
    }

    // 🔥 UPDATE TRAIL PARTICLES
    trailParticles.forEach((particle, i) => {
      if (particle.life > 0) {
        particle.life -= delta * 1.5 // Fast fade
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 4))
        particle.velocity.multiplyScalar(0.96) // Damping
        
        if (trailParticlesRef.current[i]) {
          trailParticlesRef.current[i].position.copy(particle.position)
          const lifeRatio = particle.life / particle.maxLife
          trailParticlesRef.current[i].scale.setScalar(particle.size * lifeRatio)
          trailParticlesRef.current[i].material.opacity = lifeRatio * 0.9
        }
      }
    })

    // 🌀 Rotate asteroid for visual effect
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += delta * 0.5
      asteroidRef.current.rotation.y += delta * 0.3
    }
  })

  // Scale based on asteroid diameter
  const scale = Math.max(3, (asteroid.diameter / 1000) * 30)

  return (
    <group>
      {/* 🪨 MAIN ASTEROID */}
      <mesh ref={asteroidRef} geometry={geometry} scale={scale}>
        <meshStandardMaterial
          color='#8B7355'
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* 🔥 ATMOSPHERIC ENTRY GLOW */}
      <mesh ref={glowRef} geometry={geometry} scale={scale * 1.6}>
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0}
          emissive='#ff4400'
          emissiveIntensity={0}
        />
      </mesh>
      
      {/* 🔥 BURNING TRAIL PARTICLES */}
      {trailParticles.map((particle, i) => (
        <mesh
          key={i}
          ref={el => trailParticlesRef.current[i] = el}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color='#ffaa00'
            transparent
            opacity={0.9}
            emissive='#ff6600'
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}
    </group>
  )
}

export default Asteroid