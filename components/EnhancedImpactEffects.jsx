import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'
import {
  fireballVertexShader,
  fireballFragmentShader,
  shockwaveVertexShader,
  shockwaveFragmentShader
} from '../shaders/atmosphericShaders'

function EnhancedImpactEffects() {
  const groupRef = useRef()
  const screenFlashRef = useRef()
  const fireballRef = useRef()
  const secondaryFireballRef = useRef()
  const shockwaveRefs = useRef([])
  const mushroomCloudRef = useRef()
  const seismicWaveRefs = useRef([])
  const heatWaveRef = useRef()
  
  const debrisRefs = useRef([])
  const smokeRefs = useRef([])
  const ejectaRefs = useRef([])
  const fireParticleRefs = useRef([])
  
  const [effectTime, setEffectTime] = useState(0)
  const [active, setActive] = useState(false)
  const [impactAudioPlayed, setImpactAudioPlayed] = useState(false)
  
  const { impactOccurred, impact, asteroid } = useSimulationStore()

  // Calculate physics-based impact parameters
  const impactPhysics = useMemo(() => {
    const velocity = asteroid.velocity || 20 // km/s
    const diameter = asteroid.diameter || 100 // meters
    const density = asteroid.density || 2600 // kg/m³
    const angle = asteroid.angle || 45 // degrees
    
    // Kinetic energy: KE = 0.5 * m * v²
    const radius = diameter / 2
    const volume = (4/3) * Math.PI * Math.pow(radius, 3)
    const mass = volume * density
    const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2) // Joules
    const megatonsTNT = kineticEnergy / (4.184 * 1e15) // Convert to megatons
    
    // Scale effects based on energy
    const energyScale = Math.cbrt(megatonsTNT) / 5
    const angleModifier = Math.sin((angle * Math.PI) / 180) // Oblique impacts spread more
    
    return {
      energy: megatonsTNT,
      scale: Math.max(0.5, Math.min(energyScale, 5)),
      lightIntensity: Math.max(200, energyScale * 150),
      fireballSize: Math.max(40, energyScale * 45),
      shockwaveSize: Math.max(80, energyScale * 70),
      debrisCount: Math.max(80, Math.min(Math.floor(energyScale * 50), 200)),
      smokeCount: Math.max(40, Math.floor(energyScale * 30)),
      ejectaCount: Math.max(100, Math.min(Math.floor(energyScale * 60), 250)),
      mushroomHeight: Math.max(60, energyScale * 50),
      angleModifier
    }
  }, [asteroid])

  // Fireball shader material
  const fireballMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: fireballVertexShader,
      fragmentShader: fireballFragmentShader,
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  }, [])

  // Shockwave shader material
  const shockwaveMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: shockwaveVertexShader,
      fragmentShader: shockwaveFragmentShader,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0 },
        color: { value: new THREE.Color('#ff6600') }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  }, [])

  // DEBRIS PARTICLES - ejected rocks and molten material
  const debrisParticles = useMemo(() => {
    const particles = []
    const count = impactPhysics.debrisCount
    const speedMult = impactPhysics.scale
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.35 // Upward cone
      const speed = (15 + Math.random() * 30) * speedMult
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 8 * speedMult,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: (1.5 + Math.random() * 4) * impactPhysics.scale,
        mass: Math.random() + 0.5,
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        temperature: Math.random() // For color
      })
    }
    return particles
  }, [impactPhysics])

  // EJECTA - Material thrown into suborbital trajectories
  const ejectaParticles = useMemo(() => {
    const particles = []
    const count = impactPhysics.ejectaCount
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.5 // Wider spread
      const speed = (8 + Math.random() * 20) * impactPhysics.scale
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: (0.8 + Math.random() * 2) * impactPhysics.scale,
        life: 1.0,
        falling: false
      })
    }
    return particles
  }, [impactPhysics])

  // SMOKE/DUST CLOUD
  const smokeParticles = useMemo(() => {
    const particles = []
    const count = impactPhysics.smokeCount
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4
      const speed = (3 + Math.random() * 12) * impactPhysics.scale
      
      particles.push({
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 10,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        position: new THREE.Vector3(0, 0, 0),
        size: (8 + Math.random() * 15) * impactPhysics.scale,
        expansion: 1.0,
        opacity: 0.8
      })
    }
    return particles
  }, [impactPhysics])

  // FIRE PARTICLES - spreading fires from impact zone
  const fireParticles = useMemo(() => {
    const particles = []
    const count = Math.floor(impactPhysics.debrisCount * 0.3)
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const dist = Math.random() * 20 * impactPhysics.scale
      
      particles.push({
        position: new THREE.Vector3(
          Math.cos(theta) * dist,
          0.5,
          Math.sin(theta) * dist
        ),
        size: (2 + Math.random() * 4) * impactPhysics.scale,
        phase: Math.random() * Math.PI * 2,
        intensity: Math.random()
      })
    }
    return particles
  }, [impactPhysics])

  // Activate effects on impact
  useEffect(() => {
    if (impactOccurred && !active) {
      setActive(true)
      setEffectTime(0)
    }
  }, [impactOccurred, active])

  // Play impact sound
  useEffect(() => {
    if (active && !impactAudioPlayed) {
      playImpactSound(impactPhysics.energy)
      setImpactAudioPlayed(true)
    }
  }, [active, impactAudioPlayed, impactPhysics])

  // Animation loop
  useFrame((state, delta) => {
    if (!active) return
    
    const newTime = effectTime + delta
    setEffectTime(newTime)
    
    // Position effects at impact location
    if (groupRef.current && impact && typeof impact.latitude === 'number' && typeof impact.longitude === 'number') {
      const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 301)
      if (!isNaN(impactPos.x) && !isNaN(impactPos.y) && !isNaN(impactPos.z)) {
        groupRef.current.position.copy(impactPos)
        groupRef.current.lookAt(0, 0, 0)
      }
    }
    
    // === TIMELINE-BASED EFFECTS ===
    
    // T+0s: SCREEN FLASH (0-0.5s)
    if (screenFlashRef.current && newTime < 0.5) {
      const flashIntensity = Math.max(0, 1 - newTime / 0.5)
      screenFlashRef.current.intensity = flashIntensity * impactPhysics.lightIntensity * 2
    } else if (screenFlashRef.current) {
      screenFlashRef.current.intensity = 0
    }
    
    // T+0s to T+2s: INITIAL FIREBALL EXPANSION
    if (fireballRef.current) {
      fireballMaterial.uniforms.time.value = newTime
      const fireballDuration = 2.5
      const progress = Math.min(1, newTime / fireballDuration)
      const scale = 5 + progress * impactPhysics.fireballSize
      const intensity = Math.max(0, 1 - progress * 0.7)
      
      fireballRef.current.scale.setScalar(scale)
      fireballMaterial.uniforms.intensity.value = intensity
    }
    
    // T+0.5s to T+4s: SECONDARY FIREBALL (outer explosion layer)
    if (secondaryFireballRef.current && newTime > 0.5) {
      const duration = 4.0
      const progress = Math.min(1, (newTime - 0.5) / duration)
      const scale = 15 + progress * impactPhysics.fireballSize * 1.5
      const opacity = Math.max(0, (1 - progress) * 0.6)
      
      secondaryFireballRef.current.scale.setScalar(scale)
      secondaryFireballRef.current.material.opacity = opacity
    }
    
    // T+0s to T+5s: EXPANDING SHOCKWAVES (multiple rings)
    shockwaveRefs.current.forEach((ref, i) => {
      if (ref) {
        const delay = i * 0.3
        const duration = 5.0 + i * 0.5
        if (newTime > delay) {
          const progress = Math.min(1, (newTime - delay) / duration)
          const scale = 10 + progress * impactPhysics.shockwaveSize * (1 + i * 0.3)
          const opacity = Math.max(0, (1 - progress) * 0.7)
          
          ref.scale.set(scale, scale, 1)
          ref.material.opacity = opacity
          if (ref.material.uniforms) {
            ref.material.uniforms.time.value = newTime
            ref.material.uniforms.progress.value = progress
          }
        }
      }
    })
    
    // T+1s to T+10s: SEISMIC WAVES on Earth surface
    seismicWaveRefs.current.forEach((ref, i) => {
      if (ref && newTime > 1 + i * 0.4) {
        const progress = ((newTime - 1 - i * 0.4) / 8) % 1
        const scale = 20 + progress * impactPhysics.shockwaveSize * 2
        const opacity = Math.max(0, (1 - progress) * 0.4)
        
        ref.scale.set(scale, scale, 0.1)
        ref.material.opacity = opacity
      }
    })
    
    // T+2s to T+15s: MUSHROOM CLOUD FORMATION
    if (mushroomCloudRef.current && newTime > 2) {
      const duration = 13
      const progress = Math.min(1, (newTime - 2) / duration)
      const height = progress * impactPhysics.mushroomHeight
      const capSize = 10 + progress * 30 * impactPhysics.scale
      
      mushroomCloudRef.current.position.y = height
      mushroomCloudRef.current.scale.set(capSize, capSize * 0.5, capSize)
      mushroomCloudRef.current.material.opacity = Math.max(0, 0.8 - progress * 0.4)
    }
    
    // T+0s to T+30s: HEAT DISTORTION WAVE
    if (heatWaveRef.current && newTime < 30) {
      const progress = newTime / 30
      const scale = 15 + progress * 100
      const opacity = Math.max(0, (1 - progress) * 0.3)
      
      heatWaveRef.current.scale.setScalar(scale)
      heatWaveRef.current.material.opacity = opacity
    }
    
    // === PARTICLE PHYSICS ===
    
    // DEBRIS - rocks with gravity and air resistance
    debrisParticles.forEach((particle, i) => {
      if (newTime < 8) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y -= delta * 9.8 * particle.mass // Gravity scaled by mass
        particle.velocity.multiplyScalar(0.985) // Air resistance
        
        particle.rotation.x += particle.rotationSpeed.x * delta
        particle.rotation.y += particle.rotationSpeed.y * delta
        particle.rotation.z += particle.rotationSpeed.z * delta
        
        if (debrisRefs.current[i]) {
          debrisRefs.current[i].position.copy(particle.position)
          debrisRefs.current[i].rotation.copy(particle.rotation)
          
          const life = 1 - (newTime / 8)
          debrisRefs.current[i].scale.setScalar(particle.size * life)
          
          // Color based on temperature (hot red -> cooler gray)
          const temp = particle.temperature * (1 - newTime / 8)
          const color = new THREE.Color()
          if (temp > 0.5) {
            color.setRGB(1, 0.3 + (1 - temp) * 0.7, 0)
          } else {
            color.setRGB(0.5, 0.4, 0.3)
          }
          debrisRefs.current[i].material.color.copy(color)
          debrisRefs.current[i].material.opacity = life * 0.9
        }
      }
    })
    
    // EJECTA - material that goes up and falls back down
    ejectaParticles.forEach((particle, i) => {
      if (newTime < 25) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y -= delta * 9.8 // Gravity
        
        // Mark as falling when velocity becomes negative
        if (particle.velocity.y < 0 && !particle.falling) {
          particle.falling = true
        }
        
        // Fade out falling ejecta
        if (particle.falling) {
          particle.life -= delta * 0.15
        }
        
        if (ejectaRefs.current[i] && particle.life > 0) {
          ejectaRefs.current[i].position.copy(particle.position)
          ejectaRefs.current[i].scale.setScalar(particle.size * particle.life)
          ejectaRefs.current[i].material.opacity = particle.life * 0.7
        }
      }
    })
    
    // SMOKE - rises and expands
    smokeParticles.forEach((particle, i) => {
      if (newTime < 30) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
        particle.velocity.y += delta * 4 // Buoyancy
        particle.velocity.multiplyScalar(0.96) // Drag
        particle.expansion += delta * 0.15 // Expands over time
        particle.opacity -= delta * 0.025 // Fades
        
        if (smokeRefs.current[i] && particle.opacity > 0) {
          smokeRefs.current[i].position.copy(particle.position)
          const scale = particle.size * particle.expansion
          smokeRefs.current[i].scale.setScalar(scale)
          smokeRefs.current[i].material.opacity = Math.max(0, particle.opacity)
        }
      }
    })
    
    // FIRE PARTICLES - pulsating fires in impact zone
    fireParticles.forEach((particle, i) => {
      if (newTime < 30 && fireParticleRefs.current[i]) {
        particle.phase += delta * 5
        const flicker = Math.sin(particle.phase) * 0.3 + 0.7
        const life = Math.max(0, 1 - newTime / 30)
        
        fireParticleRefs.current[i].position.copy(particle.position)
        fireParticleRefs.current[i].scale.setScalar(particle.size * flicker * life)
        fireParticleRefs.current[i].material.opacity = particle.intensity * life
      }
    })
  })

  if (!impactOccurred || !impact) return null

  return (
    <group ref={groupRef}>
      {/* MEGA BRIGHT SCREEN FLASH */}
      <pointLight
        ref={screenFlashRef}
        color='#ffffee'
        intensity={0}
        distance={800}
        decay={2}
      />
      
      {/* PRIMARY FIREBALL (shader-based) */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={fireballMaterial} attach="material" />
      </mesh>
      
      {/* SECONDARY FIREBALL */}
      <mesh ref={secondaryFireballRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0.6}
          emissive='#ff3300'
          emissiveIntensity={2}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* MULTIPLE SHOCKWAVE RINGS */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`shockwave-${i}`}
          ref={el => shockwaveRefs.current[i] = el}
        >
          <ringGeometry args={[10, 14, 128]} />
          <meshBasicMaterial
            color={i === 0 ? '#ff6600' : i === 1 ? '#ff8800' : '#ffaa00'}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            emissive='#ff4400'
            emissiveIntensity={2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* SEISMIC WAVES */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`seismic-${i}`}
          ref={el => seismicWaveRefs.current[i] = el}
          position={[0, -0.5, 0]}
        >
          <torusGeometry args={[20, 0.5, 16, 100]} />
          <meshBasicMaterial
            color='#aa6600'
            transparent
            opacity={0}
            emissive='#ff4400'
            emissiveIntensity={1}
          />
        </mesh>
      ))}
      
      {/* MUSHROOM CLOUD CAP */}
      <mesh ref={mushroomCloudRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color='#444444'
          transparent
          opacity={0}
        />
      </mesh>
      
      {/* HEAT DISTORTION WAVE */}
      <mesh ref={heatWaveRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color='#ff6600'
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* DEBRIS PARTICLES */}
      {debrisParticles.map((particle, i) => (
        <mesh
          key={`debris-${i}`}
          ref={el => debrisRefs.current[i] = el}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color='#ff6600'
            transparent
            opacity={0.9}
            emissive='#ff4400'
            emissiveIntensity={2}
          />
        </mesh>
      ))}
      
      {/* EJECTA PARTICLES */}
      {ejectaParticles.map((particle, i) => (
        <mesh
          key={`ejecta-${i}`}
          ref={el => ejectaRefs.current[i] = el}
        >
          <tetrahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color='#cc6600'
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      
      {/* SMOKE/DUST CLOUD */}
      {smokeParticles.map((particle, i) => (
        <mesh
          key={`smoke-${i}`}
          ref={el => smokeRefs.current[i] = el}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color='#333333'
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      
      {/* SPREADING FIRES */}
      {fireParticles.map((particle, i) => (
        <mesh
          key={`fire-${i}`}
          ref={el => fireParticleRefs.current[i] = el}
          position={particle.position.toArray()}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color='#ff6600'
            transparent
            opacity={0.8}
            emissive='#ff3300'
            emissiveIntensity={3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// Audio playback function
function playImpactSound(energy) {
  try {
    // Create Web Audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Create impact explosion sound
    const duration = 3
    const sampleRate = audioContext.sampleRate
    const buffer = audioContext.createBuffer(2, duration * sampleRate, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        const t = i / sampleRate
        const decay = Math.exp(-t * 2)
        
        // Explosion: white noise + low frequency rumble
        const noise = (Math.random() * 2 - 1) * decay
        const rumble = Math.sin(t * 60 * Math.PI * 2) * decay * 0.5
        const boom = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 10)
        
        channelData[i] = (noise * 0.3 + rumble * 0.5 + boom * 0.2) * Math.min(1, energy / 100)
      }
    }
    
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    
    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.3 // Volume
    
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
    source.start()
    
  } catch (error) {
    console.error('Audio playback failed:', error)
  }
}

export default EnhancedImpactEffects
