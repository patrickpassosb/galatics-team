import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactPointer() {
  const outerRef = useRef()
  const { impact, impactOccurred, isPlaying } = useSimulationStore()

  // Animate pointer (gentle pulse and rotation)
  useFrame((state) => {
    if (outerRef.current && !impactOccurred) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.08
      outerRef.current.scale.setScalar(pulse)
      
      // Slow rotation for dynamic effect
      if (!isPlaying) {
        outerRef.current.rotation.z += 0.003
      }
    }
  })

  // Don't show if impact occurred or no location set
  if (impactOccurred || !impact.latitude || !impact.longitude) return null

  // Convert lat/lon to 3D position (slightly above Earth surface)
  const position = latLonToCartesian(impact.latitude, impact.longitude, 302)

  // Calculate rotation to face away from Earth center
  const phi = (90 - impact.latitude) * Math.PI / 180
  const theta = (impact.longitude + 90) * Math.PI / 180

  return (
    <group 
      position={[position.x, position.y, position.z]}
      rotation={[phi, 0, theta]}
    >
      <group ref={outerRef}>
        {/* SUNBURST RAYS (8 dashed lines radiating outward) */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x1 = Math.cos(angle) * 15
          const y1 = Math.sin(angle) * 15
          const x2 = Math.cos(angle) * 30
          const y2 = Math.sin(angle) * 30
          
          return (
            <line key={`ray-${i}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([x1, y1, 0.5, x2, y2, 0.5])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color="#ff0000" 
                opacity={0.7} 
                transparent 
                linewidth={2}
              />
            </line>
          )
        })}

        {/* OUTER CIRCLE (largest ring) */}
        <mesh>
          <ringGeometry args={[26, 29, 64]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* MIDDLE CIRCLE */}
        <mesh position={[0, 0, 0.1]}>
          <ringGeometry args={[18, 21, 64]} />
          <meshBasicMaterial
            color="#ff2222"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* INNER CIRCLE */}
        <mesh position={[0, 0, 0.2]}>
          <ringGeometry args={[10, 13, 64]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* CENTER FILLED CIRCLE */}
        <mesh position={[0, 0, 0.3]}>
          <circleGeometry args={[6, 32]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* CENTER DOT (very bright) */}
        <mesh position={[0, 0, 0.4]}>
          <circleGeometry args={[2, 16]} />
          <meshBasicMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={1.5}
            transparent
            opacity={1}
            side={THREE.DoubleSide}
            depthTest={false}
          />
        </mesh>

        {/* GLOW EFFECT */}
        <pointLight 
          color="#ff0000" 
          intensity={0.5} 
          distance={50} 
          decay={2}
          position={[0, 0, 5]}
        />
      </group>
    </group>
  )
}

export default ImpactPointer
