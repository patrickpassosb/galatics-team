import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Earth from './Earth'

const CAMERA_CONFIG = {
  position: [0, 0, 420],
  fov: 120
}

const STARS_CONFIG = {
  radius: 1000,
  depth: 200,
  count: 9000,
  factor: 8,
  saturation: 0.1,
  fade: false,
  speed: 0.3
}

const ORBIT_CONTROLS_CONFIG = {
  enablePan: false,
  enableZoom: true,
  enableRotate: true,
  minDistance: 400,
  maxDistance: 800,
  zoomSpeed: 1.0,
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.5
}

function Scene() {
  return (
    <div className='fixed inset-0 w-full h-full'>
      <Canvas
        camera={CAMERA_CONFIG}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[600, 300, 300]} intensity={1.0} />
          <directionalLight position={[-400, 200, -200]} intensity={0.8} />

          {/* Starfield */}
          <Stars {...STARS_CONFIG} />

          {/* Earth */}
          <Earth />
          
          {/* Camera Controls */}
          <OrbitControls {...ORBIT_CONTROLS_CONFIG} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Scene
