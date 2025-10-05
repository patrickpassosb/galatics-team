import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import * as THREE from 'three'

function CameraShake() {
  const { camera } = useThree()
  const originalPosition = useRef(new THREE.Vector3())
  const shakeIntensity = useRef(0)
  const shakeTime = useRef(0)
  const isShaking = useRef(false)
  
  const { impactOccurred, asteroid } = useSimulationStore()

  // Calculate shake intensity based on impact energy
  const calculateShakeIntensity = () => {
    const velocity = asteroid.velocity || 20
    const diameter = asteroid.diameter || 100
    const energy = velocity * diameter // Simplified energy calculation
    
    // Scale shake intensity (larger impacts = more shake)
    return Math.min(15, energy / 100)
  }

  useEffect(() => {
    if (impactOccurred && !isShaking.current) {
      // Store original camera position
      originalPosition.current.copy(camera.position)
      
      // Calculate and set shake parameters
      shakeIntensity.current = calculateShakeIntensity()
      shakeTime.current = 0
      isShaking.current = true
    }
  }, [impactOccurred, camera])

  useFrame((state, delta) => {
    if (!isShaking.current) return

    shakeTime.current += delta

    // Shake duration: 4 seconds with exponential decay
    const shakeDuration = 4.0
    if (shakeTime.current < shakeDuration) {
      const progress = shakeTime.current / shakeDuration
      
      // Exponential decay for natural feel
      const decay = Math.exp(-progress * 4)
      
      // Multi-frequency shake for realism
      const fastShake = Math.sin(shakeTime.current * 30) * 0.4
      const mediumShake = Math.sin(shakeTime.current * 15) * 0.6
      const slowShake = Math.sin(shakeTime.current * 5) * 1.0
      
      const combinedShake = (fastShake + mediumShake + slowShake) / 3
      
      // Apply shake with decay
      const shakeAmount = combinedShake * shakeIntensity.current * decay
      
      // Shake in multiple directions for realism
      const shakeX = Math.sin(shakeTime.current * 25 + 1) * shakeAmount * 0.7
      const shakeY = Math.sin(shakeTime.current * 20 + 2) * shakeAmount * 0.5
      const shakeZ = Math.sin(shakeTime.current * 30 + 3) * shakeAmount * 0.3
      
      // Apply shake to camera
      camera.position.x = originalPosition.current.x + shakeX
      camera.position.y = originalPosition.current.y + shakeY
      camera.position.z = originalPosition.current.z + shakeZ
      
      // Slight rotational shake for added effect
      camera.rotation.z = Math.sin(shakeTime.current * 15) * decay * 0.02
      
    } else {
      // Shake finished - restore original position smoothly
      camera.position.lerp(originalPosition.current, 0.1)
      camera.rotation.z *= 0.9
      
      // Stop shaking when close enough
      if (camera.position.distanceTo(originalPosition.current) < 0.1) {
        camera.position.copy(originalPosition.current)
        camera.rotation.z = 0
        isShaking.current = false
      }
    }
  })

  return null // This component doesn't render anything
}

export default CameraShake
