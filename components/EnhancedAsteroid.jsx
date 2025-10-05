import React, { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import * as THREE from 'three'
import { plasmaTrailVertexShader, plasmaTrailFragmentShader } from '../shaders/atmosphericShaders'

// Easing function for dramatic acceleration
function easeInCubic(t) {
  return t * t * t
}

function EnhancedAsteroid() {
  const asteroidRef = useRef()
  const plasmaGlowRef = useRef()
  const sonicBoomRef = useRef()
  const trailGroupRef = useRef()
  
  const [atmosphericEntry, setAtmosphericEntry] = useState(false)
  const [shockwaveVisible, setShockwaveVisible] = useState(false)
  
  const { asteroid, trajectory, isPlaying } = useSimulationStore()

  // Rocky asteroid geometry with realistic surface
  const asteroidGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 2)
    const positions = geo.attributes.position.array
    
    // Create realistic rocky surface with varied deformations
    for (let i = 0; i < positions.length; i += 3) {
      const noise = Math.random() * 0.4 + 0.1
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      const len = Math.sqrt(x*x + y*y + z*z)
      
      positions[i] = x / len * (1 + noise)
      positions[i + 1] = y / len * (1 + noise)
      positions[i + 2] = z / len * (1 + noise)
    }
    
    geo.computeVertexNormals()
    return geo
  }, [])

  // Plasma trail particles with advanced physics
  const trailParticles = useMemo(() => {
    const particles = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: Math.random() * 0.5 + 0.5,
        size: Math.random() * 3 + 1,
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5)
      })
    }
    return particles
  }, [])

  // Plasma shader material for atmospheric glow
  const plasmaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: plasmaTrailVertexShader,
      fragmentShader: plasmaTrailFragmentShader,
      uniforms: {
        time: { value: 0 },
        intensity: { value: 0 },
        color1: { value: new THREE.Color('#ff4400') },
        color2: { value: new THREE.Color('#ffff00') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  }, [])

  // Sonic boom shockwave ring refs (must be created outside useMemo)
  const shockwaveRef1 = useRef()
  const shockwaveRef2 = useRef()
  const shockwaveRef3 = useRef()
  
  // Sonic boom shockwave rings data
  const shockwaveRings = useMemo(() => {
    return [
      { ref: shockwaveRef1, delay: 0, scale: 0, opacity: 0 },
      { ref: shockwaveRef2, delay: 0.15, scale: 0, opacity: 0 },
      { ref: shockwaveRef3, delay: 0.3, scale: 0, opacity: 0 }
    ]
  }, [])

  // Main animation loop
  useFrame((state, delta) => {
    if (!asteroidRef.current || !trajectory || trajectory.length === 0) return

    const store = useSimulationStore.getState()

    if (isPlaying && trajectory.length > 0) {
      // Timeline: 10 seconds approach
      const IMPACT_DURATION = 10.0
      const newTime = Math.min(IMPACT_DURATION, store.currentTime + delta)
      store.currentTime = newTime

      const normalizedTime = newTime / IMPACT_DURATION
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
          const atmosphereHeight = 150
          
          // ATMOSPHERIC ENTRY EFFECTS (~100km altitude)
          if (distToEarth < atmosphereHeight) {
            if (!atmosphericEntry) {
              setAtmosphericEntry(true)
              setShockwaveVisible(true)
            }
            
            const intensity = Math.max(0, 1 - distToEarth / atmosphereHeight)
            
            // Update plasma glow shader
            if (plasmaGlowRef.current && plasmaMaterial) {
              plasmaMaterial.uniforms.time.value = newTime
              plasmaMaterial.uniforms.intensity.value = intensity
              plasmaGlowRef.current.scale.setScalar(1 + intensity * 0.8)
            }
            
            // Spawn intense trail particles
            if (Math.random() > 0.3) {
              const deadParticle = trailParticles.find(p => p.life <= 0)
              if (deadParticle) {
                deadParticle.position.copy(newPos)
                const spreadRadius = 3 + intensity * 5
                deadParticle.velocity.set(
                  (Math.random() - 0.5) * spreadRadius,
                  (Math.random() - 0.5) * spreadRadius,
                  (Math.random() - 0.5) * spreadRadius
                )
                deadParticle.life = deadParticle.maxLife
              }
            }
            
            // Sonic boom shockwaves during high-speed entry
            if (intensity > 0.5) {
              shockwaveRings.forEach((ring, i) => {
                if (ring.ref.current) {
                  const phase = (newTime * 4 + ring.delay) % 1
                  ring.ref.current.scale.setScalar(1 + phase * 6)
                  ring.ref.current.material.opacity = (1 - phase) * intensity * 0.6
                }
              })
            }
            
            // Scale asteroid for perspective (gets larger as it approaches)
            const perspectiveScale = 1 + (1 - distToEarth / atmosphereHeight) * 0.5
            asteroidRef.current.scale.setScalar(scale * perspectiveScale)
            
          } else {
            if (atmosphericEntry) setAtmosphericEntry(false)
            if (plasmaGlowRef.current) {
              plasmaMaterial.uniforms.intensity.value = 0
            }
          }
          
          // Distance/time countdown calculation
          const distanceKm = distToEarth * 6371 / 300
          const timeToImpact = IMPACT_DURATION - newTime
          
          // Store for UI display (you can access this in your UI components)
          store.distanceToImpact = distanceKm
          store.timeToImpact = timeToImpact
          
          // DETECT IMPACT
          if (distToEarth <= 5 && !store.impactOccurred) {
            store.setImpactOccurred(true)
          }
          
          // FORCE IMPACT at end
          if (normalizedTime >= 0.99 && !store.impactOccurred) {
            store.setImpactOccurred(true)
          }
        }
      }
    } else if (trajectory.length > 0 && !isPlaying) {
      // Reset to start position
      const point = trajectory[0]
      if (point && point.position) {
        const scale = 300 / 6371
        asteroidRef.current.position.set(
          point.position[0] * scale,
          point.position[1] * scale,
          point.position[2] * scale
        )
      }
      setAtmosphericEntry(false)
      setShockwaveVisible(false)
    }

    // UPDATE TRAIL PARTICLES
    trailParticles.forEach((particle) => {
      if (particle.life > 0) {
        particle.life -= delta * 2
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 3))
        particle.velocity.multiplyScalar(0.94) // Air resistance
      }
    })

    // Rotate asteroid
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += delta * 0.3
      asteroidRef.current.rotation.y += delta * 0.2
    }
  })

  const asteroidScale = Math.max(3, (asteroid.diameter / 1000) * 30)

  return (
    <group>
      {/* MAIN ASTEROID MESH */}
      <mesh ref={asteroidRef} geometry={asteroidGeometry} scale={asteroidScale}>
        <meshStandardMaterial
          color='#7a6854'
          roughness={0.95}
          metalness={0.05}
          emissive='#2a1810'
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* PLASMA ATMOSPHERIC GLOW */}
      <mesh
        ref={plasmaGlowRef}
        geometry={asteroidGeometry}
        scale={asteroidScale * 1.8}
        material={plasmaMaterial}
      />
      
      {/* SONIC BOOM SHOCKWAVE RINGS */}
      {shockwaveVisible && shockwaveRings.map((ring, i) => (
        <mesh
          key={`shockwave-${i}`}
          ref={ring.ref}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[asteroidScale * 1.2, asteroidScale * 1.5, 32]} />
          <meshBasicMaterial
            color='#00aaff'
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* GLOWING TRAIL PARTICLES */}
      <group ref={trailGroupRef}>
        {trailParticles.map((particle, i) => {
          const lifeRatio = particle.life / particle.maxLife
          if (lifeRatio <= 0) return null
          
          return (
            <mesh key={i} position={particle.position.toArray()}>
              <sphereGeometry args={[particle.size * lifeRatio, 8, 8]} />
              <meshBasicMaterial
                color={particle.color}
                transparent
                opacity={lifeRatio * 0.85}
                emissive={particle.color}
                emissiveIntensity={3}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export default EnhancedAsteroid
