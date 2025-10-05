import React, { useMemo } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import ImpactZoneRing from './ImpactZoneRing'
import { latLonToCartesian } from '../utils/geodesicMath'
import * as THREE from 'three'

/**
 * Main Impact Target component
 * Renders geodesically-accurate impact zones on Earth's surface
 * 
 * Shows multiple concentric zones:
 * - Crater zone (red)
 * - Fireball zone (orange-red)
 * - Airblast/Shock wave zone (orange)
 * - Thermal radiation zone (yellow)
 */
function ImpactTarget({ visible = true, animate = false }) {
  const { impact, showImpactZone } = useSimulationStore()

  // Build zones from impact data
  const zones = useMemo(() => {
    if (!impact || !impact.calculated) return []
    
    const zoneList = []
    
    // Crater zone (innermost) - convert meters to km
    if (impact.craterDiameter && impact.craterDiameter > 0) {
      zoneList.push({
        radiusKm: impact.craterDiameter / 2000, // Convert meters to km
        color: '#ff0000',
        opacity: 0.6,
        label: 'Crater',
        outlineWidth: 3
      })
    }
    
    // Fireball zone - if available from enhanced calculations
    if (impact.fireballRadius && impact.fireballRadius > 0) {
      zoneList.push({
        radiusKm: impact.fireballRadius,
        color: '#ff3300',
        opacity: 0.5,
        label: 'Fireball',
        outlineWidth: 2.5
      })
    }
    
    // Airblast/Shock wave zone
    if (impact.airblastRadius && impact.airblastRadius > 0) {
      zoneList.push({
        radiusKm: impact.airblastRadius,
        color: '#ff6600',
        opacity: 0.4,
        label: 'Shock Wave',
        outlineWidth: 2
      })
    }
    
    // Thermal radiation zone
    if (impact.thermalRadius && impact.thermalRadius > 0) {
      zoneList.push({
        radiusKm: impact.thermalRadius,
        color: '#ffaa00',
        opacity: 0.3,
        label: 'Thermal',
        outlineWidth: 2
      })
    }
    
    // Seismic effects zone (if large enough impact)
    if (impact.seismicMagnitude && impact.seismicMagnitude > 6) {
      const seismicRadius = Math.pow(10, impact.seismicMagnitude - 4) * 10 // Rough estimate
      zoneList.push({
        radiusKm: seismicRadius,
        color: '#ffdd00',
        opacity: 0.2,
        label: 'Seismic',
        outlineWidth: 1.5
      })
    }
    
    // Sort by radius (largest first for proper rendering)
    return zoneList.sort((a, b) => b.radiusKm - a.radiusKm)
  }, [impact])

  // Calculate impact center
  const center = useMemo(() => {
    if (!impact || typeof impact.latitude !== 'number' || typeof impact.longitude !== 'number') {
      return null
    }
    return { lat: impact.latitude, lon: impact.longitude }
  }, [impact?.latitude, impact?.longitude])

  // Impact marker position
  const markerPosition = useMemo(() => {
    if (!center) return null
    return latLonToCartesian(center.lat, center.lon, 300.5)
  }, [center])

  // Don't render if not visible or no valid data
  if (!visible || !showImpactZone || !impact.calculated || !center || zones.length === 0) {
    return null
  }

  return (
    <group name="impact-target">
      {/* Render zones from largest to smallest */}
      {zones.map((zone, index) => (
        <ImpactZoneRing
          key={`zone-${index}-${zone.radiusKm}`}
          center={center}
          radiusKm={zone.radiusKm}
          color={zone.color}
          opacity={zone.opacity}
          lineWidth={zone.outlineWidth}
          filled={true}
          animate={animate}
        />
      ))}
      
      {/* Impact center marker */}
      {markerPosition && (
        <mesh position={markerPosition.toArray()}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial
            color='#ff0000'
            emissive='#ff0000'
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
      
      {/* Optional: Add zone labels (future enhancement) */}
      {/* You could add HTML/CSS labels here using drei's Html component */}
    </group>
  )
}

/**
 * Alternative: Custom ImpactTarget with manual zone specification
 * For more control over zones
 */
export function CustomImpactTarget({ 
  center, 
  zones = [], 
  visible = true, 
  animate = false,
  showMarker = true 
}) {
  const markerPosition = useMemo(() => {
    if (!center) return null
    return latLonToCartesian(center.lat, center.lon, 300.5)
  }, [center])

  if (!visible || !center || zones.length === 0) return null

  // Sort zones by radius (largest first)
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => b.radiusKm - a.radiusKm)
  }, [zones])

  return (
    <group name="custom-impact-target">
      {sortedZones.map((zone, index) => (
        <ImpactZoneRing
          key={`custom-zone-${index}-${zone.radiusKm}`}
          center={center}
          radiusKm={zone.radiusKm}
          color={zone.color || '#ff0000'}
          opacity={zone.opacity || 0.3}
          lineWidth={zone.outlineWidth || 2}
          filled={zone.filled !== false}
          animate={animate}
        />
      ))}
      
      {showMarker && markerPosition && (
        <mesh position={markerPosition.toArray()}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial
            color='#ff0000'
            emissive='#ff0000'
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
    </group>
  )
}

export default ImpactTarget
