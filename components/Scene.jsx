import React, { Suspense, useRef } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { TextureLoader } from 'three'
import * as THREE from 'three'
import Earth from './Earth'
import EnhancedAsteroid from './EnhancedAsteroid'
import AsteroidTrajectory from './AsteroidTrajectory'
import ImpactTarget from './ImpactTarget'
import EnhancedImpactEffects from './EnhancedImpactEffects'
import ImpactMarker from './ImpactMarker'
import ImpactPointer from './ImpactPointer'
import CameraShake from './CameraShake'

// Star Sphere Component - creates giant sphere with stars on inside surface
function StarSphere() {
  const starSphereRef = useRef()

  return (
    <mesh ref={starSphereRef}>
      <sphereGeometry args={[2000, 32, 32]} />
      <meshBasicMaterial
        color="#000000" // Black space background
        side={THREE.BackSide} // Render on inside of sphere
        transparent={false}
      />
    </mesh>
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
          <AsteroidTrajectory />
          <ImpactTarget visible={true} animate={false} />
          <EnhancedImpactEffects />
          <ImpactPointer />
          
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
