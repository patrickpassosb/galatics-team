import React, { useRef, useMemo, useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactPointer() {
  const groupRef = useRef()
  const outerRef = useRef()
  const { impact, impactOccurred, isPlaying } = useSimulationStore()

  // Don't show if impact occurred or no location set
  if (impactOccurred || !impact.latitude || !impact.longitude) return null

  // Calculate pointer position (use same coordinate system as click detection)
  const adjustedPosition = useMemo(() => {
    // Get position on Earth surface (radius 301 = slightly above 300)
    const position = latLonToCartesian(impact.latitude, impact.longitude, 301)

    // Earth is at [0, 100, 0] - just add Y offset, no rotation needed
    const EARTH_Y_OFFSET = 100

    return new THREE.Vector3(
      position.x,
      position.y + EARTH_Y_OFFSET,
      position.z
    )
  }, [impact.latitude, impact.longitude])

  // Orient pointer to face outward from Earth center
  React.useEffect(() => {
    if (groupRef.current) {
      // Make pointer look away from Earth center [0, 100, 0]
      const earthCenter = new THREE.Vector3(0, 100, 0)
      const lookTarget = new THREE.Vector3()
      lookTarget.subVectors(adjustedPosition, earthCenter)
      lookTarget.multiplyScalar(2)
      lookTarget.add(adjustedPosition)
      groupRef.current.lookAt(lookTarget)
    }
  }, [adjustedPosition])

  return (
    <group ref={groupRef} position={adjustedPosition.toArray()}>
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
