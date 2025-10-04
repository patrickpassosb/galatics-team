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

  // 🔥 ENHANCED CALCULATIONS FOR DETAILED IMPACT ANALYSIS

  // Crater depth (typically 0.25-0.35 of diameter for complex craters)
  const craterDepth = craterDiameter * 0.3

  // Volume of ejected material (approximated as a paraboloid)
  const craterVolume = (Math.PI / 4) * Math.pow(craterDiameter / 2, 2) * craterDepth

  // Fireball diameter (scales with energy, typically 2-3x crater for large impacts)
  const fireballDiameter = Math.pow(energyMegatons, 0.4) * 1.8 * 1000 // meters

  // Burn radii (based on thermal radiation intensity)
  const burnRadius3rd = thermalRadius // 3rd degree burns (already calculated)
  const burnRadius2nd = thermalRadius * 1.4 // 2nd degree burns
  const burnRadius1st = thermalRadius * 1.8 // 1st degree burns

  // Shock wave parameters
  const peakOverpressure = Math.pow(energyMegatons / airblastRadius, 0.7) * 100 // PSI
  const buildingCollapseRadius = Math.pow(energyMegatons, 0.33) * 1.5 // km (>20 PSI)
  const glassBreakageRadius = airblastRadius * 2.5 // km (>1 PSI)
  const peakDecibel = 170 + 10 * Math.log10(energyMegatons / Math.pow(airblastRadius, 2))

  // Wind blast (peak wind speed scales with overpressure)
  const peakWindSpeed = Math.pow(energyMegatons, 0.35) * 450 // km/h
  const peakWindSpeedMph = peakWindSpeed * 0.621371 // mph
  const treeDamageRadius = Math.pow(energyMegatons, 0.33) * 1.8 // km

  // Seismic effects
  const feltDistance = seismicMagnitude * 100 // km (rough approximation)
  const seismicComparison = getEarthquakeComparison(seismicMagnitude)

  // Energy comparisons
  const energyComparison = getEnergyComparison(energyMegatons)
  const windComparison = getWindComparison(peakWindSpeed)

  return {
    latitude: 40.7128, // Default NYC
    longitude: -74.0060,
    energy: energyMegatons,
    craterDiameter,
    seismicMagnitude,
    airblastRadius,
    thermalRadius,
    mass,
    // Enhanced metrics
    craterDepth,
    craterVolume,
    fireballDiameter,
    burnRadius3rd,
    burnRadius2nd,
    burnRadius1st,
    peakOverpressure,
    buildingCollapseRadius,
    glassBreakageRadius,
    peakDecibel,
    peakWindSpeed,
    peakWindSpeedMph,
    treeDamageRadius,
    feltDistance,
    seismicComparison,
    energyComparison,
    windComparison
  }
}

/**
 * Get human-readable earthquake comparison
 */
function getEarthquakeComparison(magnitude) {
  if (magnitude < 4.0) return 'Minor tremor'
  if (magnitude < 5.0) return 'Moderate earthquake'
  if (magnitude < 6.0) return 'Strong earthquake (like 1994 Northridge)'
  if (magnitude < 7.0) return 'Major earthquake (like 2010 Haiti)'
  if (magnitude < 8.0) return 'Great earthquake (like 1906 San Francisco)'
  if (magnitude < 9.0) return 'Massive earthquake (like 2011 Tōhoku)'
  return 'Mega-earthquake (unprecedented in modern times)'
}

/**
 * Get human-readable energy comparison
 */
function getEnergyComparison(megatons) {
  if (megatons < 0.02) return `${(megatons * 1000).toFixed(0)} kilotons (small tactical nuke)`
  if (megatons < 1) return `${(megatons * 50).toFixed(0)}x Hiroshima bomb`
  if (megatons < 50) return `${(megatons / 15).toFixed(1)}x Castle Bravo test`
  if (megatons < 1000) return `${(megatons / 50).toFixed(1)}x Tsar Bomba`
  if (megatons < 100000) return `${(megatons / 1000).toFixed(0)}x all nuclear weapons on Earth`
  return 'Extinction-level event'
}

/**
 * Get human-readable wind comparison
 */
function getWindComparison(kmh) {
  if (kmh < 120) return 'Hurricane Category 1'
  if (kmh < 180) return 'Hurricane Category 3'
  if (kmh < 250) return 'Hurricane Category 5'
  if (kmh < 400) return `${(kmh / 75).toFixed(1)}x Hurricane Katrina`
  if (kmh < 600) return 'EF5 Tornado winds'
  return `${(kmh / 150).toFixed(0)}x strongest tornado ever recorded`
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
