import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Earth from './Earth'
import EnhancedAsteroid from './EnhancedAsteroid'
import ImpactTarget from './ImpactTarget'
import ImpactPointer from './ImpactPointer'

// Simple star sphere background component
function StarSphere() {
  const starsCount = 2000
  const positions = React.useMemo(() => {
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000
    }
    return positions
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starsCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={2} color="#ffffff" sizeAttenuation={false} />
    </points>
  )
}


function Scene() {
  return (
    <div className='fixed inset-0 w-full h-full'>
      <Canvas
        camera={{ position: [0, 0, 420], fov: 120 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Lighting - improved for better visibility */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[600, 300, 300]} intensity={3} castShadow />
          <pointLight position={[-600, 0, -300]} intensity={0.7} />
          <hemisphereLight args={['#ffffff', '#1a1f35', 0.4]} />

          {/* Giant star sphere background - complete 360° coverage */}
          <StarSphere />

          {/* Main 3D objects */}
          <Earth />
          <EnhancedAsteroid />
          <ImpactTarget visible={true} animate={false} />
          <ImpactPointer />

          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={310}
            maxDistance={800}
            zoomSpeed={1.0}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Scene
