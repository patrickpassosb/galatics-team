import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useSimulationStore } from '../store/simulationStore'

function AsteroidTrajectory() {
  const { trajectory, showTrajectory } = useSimulationStore()

  const points = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return []
    
    const scale = 300 / 6371 // Convert from Earth radius scale to Three.js units
    
    return trajectory.map(point => [
      point.position[0] * scale,
      point.position[1] * scale,
      point.position[2] * scale
    ])
  }, [trajectory])

  if (!showTrajectory || points.length === 0) return null

  return (
    <>
      <Line
        points={points}
        color='#ff6b6b'
        lineWidth={3}
        dashed={false}
      />
      {/* Add marker points along trajectory */}
      {points.filter((_, i) => i % 10 === 0).map((point, i) => (
        <mesh key={i} position={point}>
          <sphereGeometry args={[1.2, 8, 8]} />
          <meshBasicMaterial color='#ff6b6b' />
        </mesh>
      ))}
    </>
  )
}

export default AsteroidTrajectory
