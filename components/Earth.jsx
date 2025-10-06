import React, { useRef, Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

function Earth() {
  const earthRef = useRef()
  
  // Load Earth texture
  const colorMap = useLoader(
    TextureLoader,
    'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg'
  )

  return (
    <Suspense fallback={null}>
      <mesh 
        ref={earthRef} 
        position={[0, 100, 0]}
        rotation={[0, 5.6, 0]}
      >
        <sphereGeometry args={[300, 64, 64]} />
        <meshBasicMaterial map={colorMap} />
      </mesh>
    </Suspense>
  )
}

export default Earth