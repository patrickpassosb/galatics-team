import { create } from 'zustand'
import { fetchNASANEOData } from '../services/nasaAPI'
import { calculateImpactParameters, calculateTrajectory } from '../physics/orbitalMechanics'

export const useSimulationStore = create((set, get) => ({
  // Asteroid parameters
  asteroid: {
    name: 'Custom Asteroid',
    diameter: 100, // meters
    velocity: 20, // km/s
    mass: 1.3e9, // kg (calculated from diameter)
    angle: 45, // impact angle in degrees
    azimuth: 0, // approach direction (0-360)
    distance: 1000000, // km from Earth
    density: 2600 // kg/mÂ³ typical asteroid density
  },

  // Impact parameters
  impact: {
    latitude: 40.7128,
    longitude: -74.0060,
    energy: 0, // Megatons TNT
    craterDiameter: 0, // meters
    seismicMagnitude: 0,
    airblastRadius: 0, // km
    thermalRadius: 0, // km
    calculated: false
  },

  // Trajectory data
  trajectory: [],
  
  // Simulation state
  isPlaying: false,
  currentTime: 0,
  timeScale: 1,
  showTrajectory: true,
  showImpactZone: true,
  impactOccurred: false,
  
  // NASA data
  neoData: null,
  selectedNEO: null,

  // Actions
  updateAsteroid: (updates) => set((state) => ({
    asteroid: { ...state.asteroid, ...updates }
  })),

  setImpactLocation: (lat, lon) => set((state) => ({
    impact: { ...state.impact, latitude: lat, longitude: lon }
  })),

  calculateImpact: () => {
    const { asteroid, impact } = get()
    const impactParams = calculateImpactParameters(asteroid)
    // Preserve current latitude/longitude
    set({ 
      impact: { 
        ...impactParams, 
        latitude: impact.latitude,
        longitude: impact.longitude,
        calculated: true 
      } 
    })
  },

  updateTrajectory: () => {
    const { asteroid, impact } = get()
    const trajectoryPoints = calculateTrajectory(asteroid, impact)
    
    // Validate trajectory data before setting
    if (Array.isArray(trajectoryPoints) && trajectoryPoints.length > 0) {
      const isValid = trajectoryPoints.every(point => 
        point && 
        point.position && 
        Array.isArray(point.position) && 
        point.position.length === 3 &&
        !isNaN(point.position[0]) &&
        !isNaN(point.position[1]) &&
        !isNaN(point.position[2])
      )
      
      if (isValid) {
        set({ trajectory: trajectoryPoints })
      } else {
        console.error('Invalid trajectory data detected')
        set({ trajectory: [] })
      }
    } else {
      console.error('Trajectory calculation failed')
      set({ trajectory: [] })
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setTimeScale: (scale) => set({ timeScale: scale }),

  toggleTrajectory: () => set((state) => ({ showTrajectory: !state.showTrajectory })),

  toggleImpactZone: () => set((state) => ({ showImpactZone: !state.showImpactZone })),

  setImpactOccurred: (occurred) => set({ impactOccurred: occurred }),

  fetchNEOData: async () => {
    try {
      const data = await fetchNASANEOData()
      set({ neoData: data })
      return data
    } catch (error) {
      console.error('Failed to fetch NEO data:', error)
      throw error
    }
  },

  selectNEO: (neo) => {
    // Safely parse NASA NEO data with fallbacks
    const velocityStr = neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second
    const distanceStr = neo.close_approach_data?.[0]?.miss_distance?.kilometers
    const diameterMax = neo.estimated_diameter?.meters?.estimated_diameter_max
    
    // Convert NASA NEO data to our asteroid format with proper type conversion
    const asteroid = {
      name: neo.name || 'Unknown Asteroid',
      diameter: parseFloat(diameterMax) || 100,
      velocity: parseFloat(velocityStr) || 20,
      mass: 0,
      angle: 45,
      azimuth: 0,
      distance: parseFloat(distanceStr) || 1000000,
      density: 2600
    }
    
    // Calculate mass from diameter and density
    const radius = asteroid.diameter / 2
    const volume = (4/3) * Math.PI * Math.pow(radius, 3)
    asteroid.mass = volume * asteroid.density

    set({ selectedNEO: neo, asteroid })
    
    // Calculate impact with current impact location
    const { impact } = get()
    get().calculateImpact()
    get().updateTrajectory()
  },

  reset: () => set({
    currentTime: 0,
    isPlaying: false,
    impactOccurred: false
  })
}))
