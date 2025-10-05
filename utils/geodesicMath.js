import * as THREE from 'three'

// Constants matching the simulation
export const EARTH_RADIUS_KM = 6371      // Real Earth radius in kilometers
export const EARTH_RADIUS_3D = 300       // Three.js scene scale (Earth mesh radius)
export const SCALE_FACTOR = EARTH_RADIUS_3D / EARTH_RADIUS_KM
export const MAX_RADIUS_KM = 20000       // Half Earth circumference

/**
 * Normalize longitude to [-180, 180] range
 */
export function normalizeLongitude(lon) {
  while (lon > 180) lon -= 360
  while (lon < -180) lon += 360
  return lon
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
  return radians * (180 / Math.PI)
}

/**
 * Convert latitude/longitude to 3D Cartesian coordinates (ECEF)
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @param {number} radius - Radius in scene units (default: EARTH_RADIUS_3D)
 * @returns {THREE.Vector3} 3D position
 */
export function latLonToCartesian(lat, lon, radius = EARTH_RADIUS_3D) {
  const latRad = degToRad(lat)
  const lonRad = degToRad(lon)
  
  const x = radius * Math.cos(latRad) * Math.cos(lonRad)
  const y = radius * Math.sin(latRad)
  const z = radius * Math.cos(latRad) * Math.sin(lonRad)
  
  return new THREE.Vector3(x, y, z)
}

/**
 * Convert 3D Cartesian coordinates to latitude/longitude
 * @param {THREE.Vector3} position - 3D position
 * @returns {{lat: number, lon: number}} Latitude and longitude in degrees
 */
export function cartesianToLatLon(position) {
  const radius = position.length()
  const lat = radToDeg(Math.asin(position.y / radius))
  const lon = radToDeg(Math.atan2(position.z, position.x))
  
  return { lat, lon }
}

/**
 * Generate a geodesic circle (great circle) on Earth's surface
 * Uses spherical trigonometry to calculate points at a fixed angular distance from center
 * 
 * @param {number} latCenter - Center latitude in degrees
 * @param {number} lonCenter - Center longitude in degrees
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} numPoints - Number of points to generate (default: 360)
 * @returns {THREE.Vector3[]} Array of 3D points forming the circle
 */
export function geodesicCircle(latCenter, lonCenter, radiusKm, numPoints = 360) {
  // Clamp radius to maximum
  const clampedRadius = Math.min(radiusKm, MAX_RADIUS_KM)
  
  // Convert radius to central angle (angular distance from center)
  const centralAngle = Math.min(clampedRadius / EARTH_RADIUS_KM, Math.PI)
  
  // Convert center to radians
  const lat1 = degToRad(latCenter)
  const lon1 = degToRad(lonCenter)
  
  const points = []
  
  // Special case: near poles (within 5 degrees)
  const isPolar = Math.abs(latCenter) > 85
  
  if (isPolar) {
    // Simplified calculation for polar regions
    const sign = latCenter > 0 ? 1 : -1
    const latCircle = sign * (90 - radToDeg(centralAngle))
    
    for (let i = 0; i <= numPoints; i++) {
      const lonPoint = (i / numPoints) * 360 - 180
      const point = latLonToCartesian(latCircle, lonPoint, EARTH_RADIUS_3D + 0.5)
      points.push(point)
    }
  } else {
    // Standard spherical geometry calculation
    for (let i = 0; i <= numPoints; i++) {
      const bearing = (i / numPoints) * 2 * Math.PI
      
      // Spherical trigonometry formulas (Haversine-based)
      // Calculate destination point given distance and bearing from start point
      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(centralAngle) +
        Math.cos(lat1) * Math.sin(centralAngle) * Math.cos(bearing)
      )
      
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(centralAngle) * Math.cos(lat1),
        Math.cos(centralAngle) - Math.sin(lat1) * Math.sin(lat2)
      )
      
      // Convert to Cartesian coordinates with slight elevation to prevent z-fighting
      const latDeg = radToDeg(lat2)
      const lonDeg = normalizeLongitude(radToDeg(lon2))
      
      const point = latLonToCartesian(latDeg, lonDeg, EARTH_RADIUS_3D + 0.5)
      points.push(point)
    }
  }
  
  return points
}

/**
 * Generate multiple concentric geodesic circles for gradient effect
 * @param {number} latCenter - Center latitude in degrees
 * @param {number} lonCenter - Center longitude in degrees
 * @param {number} radiusKm - Base radius in kilometers
 * @param {number} numRings - Number of rings to generate (default: 4)
 * @param {number} numPoints - Points per ring (default: 360)
 * @returns {THREE.Vector3[][]} Array of point arrays
 */
export function geodesicRings(latCenter, lonCenter, radiusKm, numRings = 4, numPoints = 360) {
  const rings = []
  
  for (let i = 0; i < numRings; i++) {
    const factor = 0.98 + (i * 0.01) // 0.98, 0.99, 1.00, 1.01
    const adjustedRadius = radiusKm * factor
    const ring = geodesicCircle(latCenter, lonCenter, adjustedRadius, numPoints)
    rings.push(ring)
  }
  
  return rings
}

/**
 * Triangulate a spherical cap for filled zone rendering
 * Creates a triangle fan from center to circle edge
 * 
 * @param {number} latCenter - Center latitude in degrees
 * @param {number} lonCenter - Center longitude in degrees
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} segments - Number of segments (default: 64)
 * @returns {{vertices: Float32Array, indices: Uint16Array}} Geometry data
 */
export function triangulateSphericalCap(latCenter, lonCenter, radiusKm, segments = 64) {
  // Get center point
  const centerPoint = latLonToCartesian(latCenter, lonCenter, EARTH_RADIUS_3D + 0.3)
  
  // Get circle points
  const circlePoints = geodesicCircle(latCenter, lonCenter, radiusKm, segments)
  
  // Build vertices array: [center, ...circle points]
  const vertices = new Float32Array((segments + 2) * 3)
  
  // Center vertex
  vertices[0] = centerPoint.x
  vertices[1] = centerPoint.y
  vertices[2] = centerPoint.z
  
  // Circle vertices
  for (let i = 0; i < circlePoints.length; i++) {
    const point = circlePoints[i]
    vertices[(i + 1) * 3 + 0] = point.x
    vertices[(i + 1) * 3 + 1] = point.y
    vertices[(i + 1) * 3 + 2] = point.z
  }
  
  // Build indices array (triangle fan)
  const indices = new Uint16Array(segments * 3)
  
  for (let i = 0; i < segments; i++) {
    indices[i * 3 + 0] = 0                    // Center
    indices[i * 3 + 1] = i + 1                // Current point
    indices[i * 3 + 2] = ((i + 1) % segments) + 1  // Next point (wrap around)
  }
  
  return { vertices, indices }
}

/**
 * Calculate normal vectors for spherical surface at given points
 * Normals point outward from Earth's center
 * 
 * @param {THREE.Vector3[]} points - Array of surface points
 * @returns {THREE.Vector3[]} Array of normal vectors
 */
export function calculateSurfaceNormals(points) {
  return points.map(point => point.clone().normalize())
}

/**
 * Calculate great circle distance between two lat/lon points
 * Uses Haversine formula
 * 
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
export function greatCircleDistance(lat1, lon1, lat2, lon2) {
  const φ1 = degToRad(lat1)
  const φ2 = degToRad(lat2)
  const Δφ = degToRad(lat2 - lat1)
  const Δλ = degToRad(lon2 - lon1)
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return EARTH_RADIUS_KM * c
}

/**
 * Check if a point is visible from the camera (front-facing)
 * @param {THREE.Vector3} point - Point on sphere
 * @param {THREE.Vector3} cameraPosition - Camera position
 * @returns {number} Facing factor (0 = back-facing, 1 = front-facing)
 */
export function calculateFacingFactor(point, cameraPosition) {
  const normal = point.clone().normalize()
  const viewDirection = cameraPosition.clone().sub(point).normalize()
  const facing = normal.dot(viewDirection)
  
  return Math.max(0, facing)
}
