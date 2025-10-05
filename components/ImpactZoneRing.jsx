import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { geodesicCircle, calculateSurfaceNormals } from '../utils/geodesicMath'

/**
 * Individual impact zone ring component
 * Renders a single geodesic circle on Earth's surface
 */
function ImpactZoneRing({ 
  center, 
  radiusKm, 
  color = '#ff0000', 
  opacity = 0.5,
  lineWidth = 2,
  filled = true,
  animate = false,
  gradientRings = false
}) {
  const outlineRef = useRef()
  const filledRef = useRef()
  const materialRef = useRef()
  
  // Generate geodesic circle points
  const points = useMemo(() => {
    if (!center || !radiusKm) return []
    return geodesicCircle(center.lat, center.lon, radiusKm, 180) // 180 points for smooth circle
  }, [center?.lat, center?.lon, radiusKm])

  // Create line geometry for outline
  const lineGeometry = useMemo(() => {
    if (points.length === 0) return null
    
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(points.length * 3)
    
    points.forEach((point, i) => {
      positions[i * 3 + 0] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    })
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    return geometry
  }, [points])

  // Create filled mesh geometry (triangle fan)
  const filledGeometry = useMemo(() => {
    if (points.length === 0 || !filled) return null
    
    const geometry = new THREE.BufferGeometry()
    
    // Calculate center point
    const centerPoint = new THREE.Vector3()
    points.forEach(p => centerPoint.add(p))
    centerPoint.divideScalar(points.length)
    
    // Vertices: center + circle points
    const vertices = []
    const indices = []
    
    // Add center
    vertices.push(centerPoint.x, centerPoint.y, centerPoint.z)
    
    // Add circle points
    points.forEach(p => {
      vertices.push(p.x, p.y, p.z)
    })
    
    // Create triangle fan indices
    for (let i = 0; i < points.length - 1; i++) {
      indices.push(0, i + 1, i + 2)
    }
    
    const positionsArray = new Float32Array(vertices)
    const indicesArray = new Uint16Array(indices)
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3))
    geometry.setIndex(new THREE.BufferAttribute(indicesArray, 1))
    geometry.computeVertexNormals()
    
    return geometry
  }, [points, filled])

  // Animation loop
  useFrame((state) => {
    if (animate && materialRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.85
      materialRef.current.opacity = opacity * pulse
    }
  })

  // Update geometry when points change
  useEffect(() => {
    if (lineGeometry && outlineRef.current) {
      outlineRef.current.geometry = lineGeometry
    }
    if (filledGeometry && filledRef.current) {
      filledRef.current.geometry = filledGeometry
    }
  }, [lineGeometry, filledGeometry])

  if (points.length === 0) return null

  return (
    <group>
      {/* Filled zone */}
      {filled && filledGeometry && (
        <mesh ref={filledRef} geometry={filledGeometry}>
          <meshBasicMaterial
            ref={materialRef}
            color={color}
            transparent
            opacity={opacity}
            side={THREE.DoubleSide}
            depthTest={true}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
      
      {/* Outline ring */}
      {lineGeometry && (
        <lineLoop ref={outlineRef} geometry={lineGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={Math.min(opacity + 0.3, 1)}
            linewidth={lineWidth}
            depthTest={true}
          />
        </lineLoop>
      )}
    </group>
  )
}

export default ImpactZoneRing
