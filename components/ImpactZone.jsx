import React from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { latLonToCartesian } from '../physics/orbitalMechanics'
import * as THREE from 'three'

function ImpactZone() {
  const { impact, showImpactZone } = useSimulationStore()

  if (!showImpactZone || !impact.calculated) return null

  // Convert impact location to 3D coordinates
  const impactPos = latLonToCartesian(impact.latitude, impact.longitude, 300.5)
  
  // Scale for visualization (Earth radius = 300 in our scene)
  const earthRadius = 300
  const kmToUnits = earthRadius / 6371

  // Create circles for different blast zones
  const zones = [
    { radius: impact.craterDiameter / 2, color: '#ff0000', name: 'Crater' },
    { radius: impact.airblastRadius, color: '#ff6b00', name: 'Airblast' },
    { radius: impact.thermalRadius, color: '#ffaa00', name: 'Thermal' }
  ]

  return (
    <group>
      {zones.map((zone, index) => {
        const radius = zone.radius * kmToUnits
        if (radius <= 0) return null

        return (
          <mesh key={index} position={impactPos.toArray()}>
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial
              color={zone.color}
              transparent
              opacity={0.3 - index * 0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      
      {/* Impact marker */}
      <mesh position={impactPos.toArray()}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color='#ff0000' />
      </mesh>
    </group>
  )
}

export default ImpactZone
