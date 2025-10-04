import * as THREE from 'three'

// Constants
const EARTH_RADIUS = 6371 // km
const G = 6.67430e-11 // Gravitational constant
const EARTH_MASS = 5.972e24 // kg

/**
 * Calculate impact parameters based on asteroid properties
 */
export function calculateImpactParameters(asteroid) {
  const { diameter, velocity, angle, density } = asteroid

  // Calculate mass if not provided
  const radius = diameter / 2
  const volume = (4/3) * Math.PI * Math.pow(radius, 3)
  const mass = volume * density

  // Convert velocity from km/s to m/s
  const velocityMS = velocity * 1000

  // Calculate kinetic energy (Joules)
  const kineticEnergy = 0.5 * mass * Math.pow(velocityMS, 2)

  // Convert to megatons TNT (1 megaton = 4.184e15 J)
  const energyMegatons = kineticEnergy / 4.184e15

  // Calculate crater diameter using scaling laws
  // Simple scaling: D_crater â‰ˆ D_projectile * (Ï_projectile/Ï_target)^(1/3) * (v/v_0)^0.44
  const targetDensity = 2500 // average Earth crust density kg/mÂ³
  const v0 = 12000 // reference velocity m/s
  const craterDiameter = diameter * 
                        Math.pow(density / targetDensity, 1/3) * 
                        Math.pow(velocityMS / v0, 0.44) * 
                        20 // scaling factor

  // Seismic magnitude (Richter scale approximation)
  const seismicMagnitude = 0.67 * Math.log10(energyMegatons) + 3.87

  // Airblast radius (km) - significant overpressure damage
  const airblastRadius = Math.pow(energyMegatons, 0.33) * 2.2

  // Thermal radiation radius (km) - 3rd degree burns
  const thermalRadius = Math.pow(energyMegatons, 0.41) * 1.5

  return {
    latitude: 40.7128, // Default NYC
    longitude: -74.0060,
    energy: energyMegatons,
    craterDiameter,
    seismicMagnitude,
    airblastRadius,
    thermalRadius,
    mass
  }
}

/**
 * Calculate asteroid trajectory approaching Earth
 */
export function calculateTrajectory(asteroid, impact) {
  const trajectoryPoints = []
  const steps = 100
  
  // Starting distance (km from Earth's center)
  const startDistance = asteroid.distance || 1000000
  
  // Impact point on Earth surface
  const impactLat = impact.latitude * Math.PI / 180
  const impactLon = impact.longitude * Math.PI / 180
  
  // Convert to Cartesian coordinates
  const impactPoint = latLonToCartesian(
    impact.latitude,
    impact.longitude,
    EARTH_RADIUS
  )

  // Calculate approach vector (simplified - assumes straight-line approach)
  const azimuthRad = asteroid.azimuth * Math.PI / 180
  const angleRad = asteroid.angle * Math.PI / 180
  
  // Approach direction vector
  const approachDir = new THREE.Vector3(
    Math.cos(azimuthRad) * Math.sin(angleRad),
    Math.sin(azimuthRad) * Math.sin(angleRad),
    Math.cos(angleRad)
  ).normalize()

  // Generate trajectory points
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const distance = startDistance * (1 - t) + EARTH_RADIUS * t
    
    // Apply some gravitational curve effect
    const gravityCurve = Math.pow(1 - t, 2) * 0.2
    
    const position = new THREE.Vector3()
      .copy(impactPoint)
      .add(
        approachDir.clone().multiplyScalar(distance - EARTH_RADIUS + gravityCurve * startDistance)
      )

    trajectoryPoints.push({
      position: position.toArray(),
      distance,
      time: t
    })
  }

  return trajectoryPoints
}

/**
 * Convert lat/lon to 3D Cartesian coordinates
 */
export function latLonToCartesian(lat, lon, radius = EARTH_RADIUS) {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lon + 180) * Math.PI / 180

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}

/**
 * Convert Cartesian to lat/lon
 */
export function cartesianToLatLon(x, y, z) {
  const radius = Math.sqrt(x*x + y*y + z*z)
  const lat = 90 - (Math.acos(y / radius) * 180 / Math.PI)
  const lon = (Math.atan2(z, -x) * 180 / Math.PI) - 180

  return { lat, lon }
}

/**
 * Calculate orbital velocity for circular orbit at given altitude
 */
export function calculateOrbitalVelocity(altitude) {
  const radius = (EARTH_RADIUS + altitude) * 1000 // convert to meters
  const velocity = Math.sqrt(G * EARTH_MASS / radius)
  return velocity / 1000 // convert to km/s
}

/**
 * Apply mitigation strategy (e.g., kinetic impactor)
 */
export function applyMitigationStrategy(asteroid, strategy) {
  const modified = { ...asteroid }

  switch (strategy.type) {
    case 'kinetic_impactor':
      // Change velocity by small amount (delta-v)
      const deltaV = strategy.deltaV || 0.01 // km/s
      modified.velocity += deltaV
      
      // Slight trajectory change
      modified.azimuth += strategy.azimuthChange || 1
      break

    case 'gravity_tractor':
      // Gradual trajectory modification
      modified.azimuth += strategy.azimuthChange || 0.5
      modified.angle += strategy.angleChange || 0.5
      break

    case 'nuclear_device':
      // Significant velocity change
      modified.velocity += strategy.deltaV || 0.1
      break

    default:
      break
  }

  return modified
}

export default {
  calculateImpactParameters,
  calculateTrajectory,
  latLonToCartesian,
  cartesianToLatLon,
  calculateOrbitalVelocity,
  applyMitigationStrategy
}
