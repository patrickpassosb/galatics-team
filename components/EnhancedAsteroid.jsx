import React, { useRef, useMemo, useEffect } from 'react'
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

  const { asteroid, trajectory } = useSimulationStore()

  // Shockwave visibility based on asteroid velocity (sonic boom effect)
  const shockwaveVisible = asteroid.velocity > 15 // Visible when velocity > 15 km/s

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

  // Set asteroid to initial position when trajectory is available
  React.useEffect(() => {
    if (asteroidRef.current && trajectory && trajectory.length > 0) {
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
  }, [trajectory])

  // Update particle trails (static for visual effect)
  React.useEffect(() => {
    if (trailParticles.length > 0) {
      trailParticles.forEach((particle) => {
        if (particle.life > 0) {
          particle.life -= 0.02 // Slow decay for static effect
        }
      })
    }
  }, [])

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
      {shockwaveVisible && shockwaveRings.map((ring, i) => {
        const refs = [shockwaveRef1, shockwaveRef2, shockwaveRef3]
        return (
          <mesh
            key={`shockwave-${i}`}
            ref={refs[i]}
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
        )
      })}
      
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
