import React, { useRef, Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg'

function Earth() {
  const earthRef = useRef()
  const colorMap = useLoader(TextureLoader, EARTH_TEXTURE_URL)

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