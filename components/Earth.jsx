import React, { useRef, Suspense } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

function EarthMesh() {
  const earthRef = useRef()

  // Load Earth texture
  const colorMap = useLoader(
    TextureLoader,
    'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg'
  )

  // Slow rotation
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <mesh ref={earthRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[300, 128, 128]} />
      <meshStandardMaterial
        map={colorMap}
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  )
}

function EarthFallback() {
  const earthRef = useRef()

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <mesh ref={earthRef} position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[300, 128, 128]} />
      <meshStandardMaterial
        color="#1e4d8b"
        emissive="#0d2847"
        emissiveIntensity={0.15}
        metalness={0.2}
        roughness={0.8}
      />
    </mesh>
  )
}

function Earth() {
  return (
    <Suspense fallback={<EarthFallback />}>
      <EarthMesh />
    </Suspense>
  )
}

export default Earth
