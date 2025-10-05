import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Earth from './Earth'
import EnhancedAsteroid from './EnhancedAsteroid'
import AsteroidTrajectory from './AsteroidTrajectory'
import ImpactTarget from './ImpactTarget'
import EnhancedImpactEffects from './EnhancedImpactEffects'
import ImpactMarker from './ImpactMarker'
import CameraShake from './CameraShake'

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

          {/* Space background */}
          <Stars radius={500} depth={100} count={5000} factor={7} saturation={0} fade speed={1} />

          {/* Main 3D objects */}
          <Earth />
          <EnhancedAsteroid />
          <AsteroidTrajectory />
          <ImpactTarget visible={true} animate={false} />
          <EnhancedImpactEffects />
          <ImpactMarker />
          
          {/* Camera effects */}
          <CameraShake />

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
