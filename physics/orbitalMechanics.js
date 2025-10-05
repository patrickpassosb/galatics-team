import * as THREE from 'three'

// Constantes Físicas
const EARTH_RADIUS = 6371 // km
const G = 6.67430e-11 // Constante gravitacional (m³/kg·s²)
const EARTH_MASS = 5.972e24 // kg
const EARTH_GRAVITY = 9.81 // m/s²
const ESCAPE_VELOCITY = 11.2 // km/s
const ATMOSPHERE_HEIGHT = 100 // km
const SCALE_HEIGHT = 8.5 // km - altura de escala atmosférica

// Densidades típicas (kg/m³)
const DENSITIES = {
  rocky: 3000,
  iron: 8000,
  carbonaceous: 2000,
  icy: 500
}

/**
 * Determine if impact location is ocean or land based on lat/lon
 */
function isOceanImpact(latitude, longitude) {
  // Simplified model - Major land masses
  const isNorthAmerica = (latitude > 15 && latitude < 75) && (longitude > -170 && longitude < -50)
  const isSouthAmerica = (latitude > -55 && latitude < 15) && (longitude > -82 && longitude < -35)
  const isEurope = (latitude > 35 && latitude < 70) && (longitude > -10 && longitude < 60)
  const isAfrica = (latitude > -35 && latitude < 37) && (longitude > -20 && longitude < 55)
  const isAsia = (latitude > -10 && latitude < 75) && (longitude > 25 && longitude < 180)
  const isAustralia = (latitude > -45 && latitude < -10) && (longitude > 110 && longitude < 155)
  
  const isLand = isNorthAmerica || isSouthAmerica || isEurope || isAfrica || isAsia || isAustralia
  
  return !isLand
}

/**
 * Calcula parâmetros de impacto baseados nas propriedades do asteroide
 * Usa modelos físicos validados por Collins et al. (2005) e Ward & Asphaug (2000)
 */
export function calculateImpactParameters(asteroid, impact = {}) {
  const { diameter, velocity, angle, density } = asteroid
  const { latitude = 0, longitude = 0 } = impact

  // Determinar tipo de impacto (oceano ou terra)
  const impactLocation = isOceanImpact(latitude, longitude) ? 'ocean' : 'land'

  // Calcular massa do asteroide
  const radius = diameter / 2
  const volume = (4/3) * Math.PI * Math.pow(radius, 3)
  const mass = volume * density

  // Converter velocidade de km/s para m/s
  const velocityMS = velocity * 1000

  // Verificar se o asteroide sobrevive à atmosfera
  const atmosphericSurvival = calculateAtmosphericEntry(diameter, velocityMS, angle, density)
  
  // Ajustar massa e velocidade após entrada atmosférica
  const effectiveMass = mass * atmosphericSurvival.massFraction
  const effectiveVelocity = velocityMS * atmosphericSurvival.velocityFraction

  // Calcular energia cinética (Joules): E = ½mv²
  const kineticEnergy = 0.5 * effectiveMass * Math.pow(effectiveVelocity, 2)

  // Fator de eficiência baseado no ângulo de impacto
  const angleRad = angle * Math.PI / 180
  const impactEfficiency = Math.pow(Math.sin(angleRad), 1/3)
  const effectiveEnergy = kineticEnergy * impactEfficiency

  // Converter para megatons TNT (1 megaton = 4.184×10¹⁵ J)
  const energyMegatons = effectiveEnergy / 4.184e15

  // Calcular diâmetro da cratera usando Schmidt-Holsapple scaling
  const targetDensity = impactLocation === 'ocean' ? 1000 : 2500
  const craterDiameter = calculateCraterDiameter(
    diameter,
    effectiveVelocity,
    density,
    targetDensity,
    angleRad,
    impactLocation
  )

  // Profundidade da cratera
  const craterDepth = craterDiameter / 5

  // Magnitude sísmica: M = (2/3) × log₁₀(E) - 3.2
  const seismicMagnitude = Math.max(0, (2/3) * Math.log10(kineticEnergy) - 3.2)

  // Raios de efeito baseados em modelos empíricos validados
  const airblastRadius = 2.2 * Math.pow(energyMegatons, 1/3) // km - 5 psi sobrepressão
  const thermalRadius = 1.9 * Math.pow(energyMegatons, 0.41) // km - queimaduras de 3º grau
  const fireballRadius = 0.14 * Math.pow(energyMegatons, 0.4) // km - raio da bola de fogo
  const fireballDiameter = fireballRadius * 2 // km - diâmetro da bola de fogo
  const radiationRadius = 1.5 * Math.pow(energyMegatons, 0.38) // km - radiação ionizante
  
  // Raio sísmico (onde tremor é sentido)
  const seismicRadius = seismicMagnitude > 6 ? Math.pow(10, seismicMagnitude - 4) * 10 : 0
  
  // Efeitos específicos para impactos oceânicos
  let tsunamiHeight = 0
  let tsunamiRadius = 0
  let tsunamiData = null
  let oceanDepth = 4 // km - profundidade média dos oceanos
  
  if (impactLocation === 'ocean') {
    tsunamiData = calculateTsunamiHeight(energyMegatons, craterDiameter, oceanDepth)
    tsunamiHeight = tsunamiData.coastalHeight
    tsunamiRadius = tsunamiData.effectiveRadius
  }

  // Ejecta e poeira atmosférica
  const ejectaVolume = Math.PI * Math.pow(craterDiameter / 2, 2) * craterDepth * 1e9 // m³
  const dustInAtmosphere = ejectaVolume * 0.1 // fração que entra na atmosfera

  // Raios de queimadura detalhados
  const burnRadius3rd = thermalRadius
  const burnRadius2nd = thermalRadius * 1.4
  const burnRadius1st = thermalRadius * 1.8

  // Parâmetros de onda de choque
  const peakOverpressure = Math.pow(energyMegatons / airblastRadius, 0.7) * 100 // PSI
  const buildingCollapseRadius = Math.pow(energyMegatons, 0.33) * 1.5 // km (>20 PSI)
  const glassBreakageRadius = airblastRadius * 2.5 // km (>1 PSI)
  const peakDecibel = 170 + 10 * Math.log10(energyMegatons / Math.pow(airblastRadius, 2))

  // Velocidade do vento
  const peakWindSpeed = Math.pow(energyMegatons, 0.35) * 450 // km/h
  const peakWindSpeedMph = peakWindSpeed * 0.621371
  const treeDamageRadius = Math.pow(energyMegatons, 0.33) * 1.8

  // Efeitos sísmicos
  const feltDistance = seismicMagnitude * 100
  const seismicComparison = getEarthquakeComparison(seismicMagnitude)

  // Comparações de energia
  const energyComparison = getEnergyComparison(energyMegatons)
  const windComparison = getWindComparison(peakWindSpeed)

  return {
    energy: energyMegatons,
    craterDiameter,
    craterDepth,
    seismicMagnitude,
    seismicRadius,
    airblastRadius,
    thermalRadius,
    fireballDiameter,
    fireballRadius,
    radiationRadius,
    tsunamiHeight,
    tsunamiRadius,
    ejectaVolume,
    dustInAtmosphere,
    mass: effectiveMass,
    effectiveVelocity: effectiveVelocity / 1000,
    atmosphericSurvival,
    impactEfficiency,
    impactAngle: angle,
    impactLocation,
    // Enhanced metrics
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
    windComparison,
    // Tsunami data if ocean impact
    ...(tsunamiData ? {
      tsunamiWavelength: tsunamiData.wavelength,
      tsunamiSpeed: tsunamiData.waveSpeed,
      inundationDistance: tsunamiData.inundationDistance
    } : {})
  }
}

/**
 * Calcula sobrevivência atmosférica e fragmentação
 * Modelo baseado em Hills & Goda (1993) e Chyba et al. (1993)
 */
function calculateAtmosphericEntry(diameter, velocity, angle, density) {
  const angleRad = angle * Math.PI / 180
  const entryAngle = Math.sin(angleRad)
  
  // Força tensil do material (Pa)
  let strength
  if (density < 1000) {
    strength = 1e5 // Cometas muito fracos
  } else if (density < 2000) {
    strength = 1e6 // Asteroides carbonáceos
  } else if (density < 3500) {
    strength = 5e6 // Asteroides rochosos
  } else {
    strength = 1e7 // Asteroides metálicos
  }
  
  const rho0 = 1.225 // kg/m³ ao nível do mar
  const H = SCALE_HEIGHT * 1000 // metros
  
  // Altitude de fragmentação
  const fragmentAltitude = -H * Math.log((2 * strength) / (rho0 * velocity * velocity))
  const fragmentAltitudeKm = Math.max(0, fragmentAltitude / 1000)
  
  const atmosphericDensity = rho0 * Math.exp(-fragmentAltitude / H)
  const dynamicPressure = 0.5 * atmosphericDensity * Math.pow(velocity, 2)
  const fragmentationRatio = dynamicPressure / strength
  
  let massFraction = 1.0
  let velocityFraction = 1.0
  let airburst = false
  
  if (diameter < 200) {
    if (fragmentationRatio > 1) {
      airburst = true
      const ablationFactor = Math.exp(-diameter / 100)
      massFraction = Math.max(0.01, 1 - ablationFactor * (fragmentationRatio - 1) * 0.5)
      
      const volume = (4/3) * Math.PI * Math.pow(diameter/2, 3)
      const dragCoefficient = 2.0
      const crossSection = Math.PI * Math.pow(diameter / 2, 2)
      const dragFactor = (dragCoefficient * atmosphericDensity * crossSection) / (2 * density * volume)
      
      velocityFraction = Math.max(0.1, 1 - dragFactor * fragmentationRatio * 0.3)
    }
    
    if (diameter < 50) {
      const ablationLoss = Math.exp(-diameter / 25)
      massFraction *= (1 - ablationLoss * 0.7)
      velocityFraction *= (1 - ablationLoss * 0.5)
    }
  }
  
  const airburstAltitude = airburst ? fragmentAltitudeKm : 0
  
  return {
    massFraction: Math.max(0.01, massFraction),
    velocityFraction: Math.max(0.1, velocityFraction),
    fragmentationAltitude: airburstAltitude,
    airburst,
    fragmentationRatio,
    dynamicPressure
  }
}

/**
 * Calcula diâmetro da cratera usando Schmidt-Holsapple scaling
 * Collins et al. (2005) - "Earth Impact Effects Program"
 */
function calculateCraterDiameter(diameter, velocity, projectileDensity, targetDensity, angle, impactLocation) {
  const L = diameter  // meters
  const v = velocity  // m/s
  const g = 9.81      // m/s²
  
  // Constantes corretas de Collins et al. (2005)
  const K1 = impactLocation === 'ocean' ? 1.88 : 1.161
  const mu = 0.41  // velocity coupling
  const nu = 0.41  // size coupling (CORRECTED)
  
  // Expoentes de escala
  const alpha = (2 * mu + nu) / (3 * nu)  // ≈ 0.78
  const beta = (2 * nu) / 3                // ≈ 0.27
  
  // Fórmula Schmidt-Holsapple
  const densityRatio = projectileDensity / targetDensity
  const froudeNumber = (v * v) / (g * L)  // número de Froude
  const angleFactor = Math.pow(Math.sin(angle), 1/3)
  
  const craterDiameterMeters = K1 * 
    Math.pow(L, alpha) * 
    Math.pow(densityRatio, beta) * 
    Math.pow(froudeNumber, mu) * 
    angleFactor
  
  // Converter para km
  const craterDiameterKm = craterDiameterMeters / 1000
  
  // Cratera mínima é ~15x o diâmetro do projétil
  const minimumCraterKm = (L * 15) / 1000
  
  return Math.max(craterDiameterKm, minimumCraterKm)
}

/**
 * Calcula altura do tsunami - Ward & Asphaug (2000)
 */
function calculateTsunamiHeight(energyMegatons, craterDiameter, oceanDepth = 4) {
  const impactEnergy = energyMegatons * 4.184e15  // Joules
  const E_normalized = impactEnergy / 4.2e15
  const d_normalized = oceanDepth / 4
  
  // Ward & Asphaug (2000) deep water wave height
  const h0 = 0.14 * Math.pow(E_normalized, 0.33) * Math.pow(d_normalized, -0.5)
  
  // Comprimento de onda (km)
  const wavelength = 2.5 * Math.pow(E_normalized, 0.25)
  
  // Velocidade do tsunami (km/h): v = √(g×d)
  const g = 9.81 / 1000  // km/s²
  const waveSpeed = Math.sqrt(g * oceanDepth) * 3600  // km/h
  
  // Run-up costeiro (Green's Law): h_coast = h₀ × (d_ocean/d_shore)^0.25
  const shoreDepth = 0.01  // km
  const runupFactor = Math.pow(oceanDepth / shoreDepth, 0.25)
  const coastalHeight = h0 * runupFactor
  
  // Distância de inundação terrestre (km)
  const inundationDistance = coastalHeight * 0.3
  
  // Raio efetivo onde onda > 1m
  const effectiveRadius = Math.min(wavelength * 50, 5000)
  
  return {
    initialHeight: h0,
    wavelength,
    waveSpeed,
    coastalHeight: Math.min(coastalHeight, 300),
    runupFactor,
    inundationDistance,
    effectiveRadius
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
  
  const startDistance = asteroid.distance || 1000000
  
  const impactPoint = latLonToCartesian(
    impact.latitude,
    impact.longitude,
    EARTH_RADIUS
  )

  const azimuthRad = asteroid.azimuth * Math.PI / 180
  const angleRad = asteroid.angle * Math.PI / 180
  
  const approachDir = new THREE.Vector3(
    Math.cos(azimuthRad) * Math.sin(angleRad),
    Math.sin(azimuthRad) * Math.sin(angleRad),
    Math.cos(angleRad)
  ).normalize()

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const distance = startDistance * (1 - t) + EARTH_RADIUS * t
    
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
  const radius = (EARTH_RADIUS + altitude) * 1000
  const velocity = Math.sqrt(G * EARTH_MASS / radius)
  return velocity / 1000
}

/**
 * Apply mitigation strategy
 */
export function applyMitigationStrategy(asteroid, strategy) {
  const modified = { ...asteroid }

  switch (strategy.type) {
    case 'kinetic_impactor':
      const deltaV = strategy.deltaV || 0.01
      modified.velocity += deltaV
      modified.azimuth += strategy.azimuthChange || 1
      break

    case 'gravity_tractor':
      modified.azimuth += strategy.azimuthChange || 0.5
      modified.angle += strategy.angleChange || 0.5
      break

    case 'nuclear_device':
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
  applyMitigationStrategy,
  DENSITIES,
  EARTH_RADIUS,
  ESCAPE_VELOCITY,
  EARTH_MASS,
  G
}