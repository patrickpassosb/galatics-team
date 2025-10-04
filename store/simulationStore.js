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
    const { asteroid } = get()
    const impactParams = calculateImpactParameters(asteroid)
    set({ impact: { ...impactParams, calculated: true } })
  },

  updateTrajectory: () => {
    const { asteroid, impact } = get()
    const trajectoryPoints = calculateTrajectory(asteroid, impact)
    set({ trajectory: trajectoryPoints })
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
    // Convert NASA NEO data to our asteroid format
    const asteroid = {
      name: neo.name,
      diameter: neo.estimated_diameter.meters.estimated_diameter_max,
      velocity: neo.close_approach_data[0]?.relative_velocity.kilometers_per_second || 20,
      mass: 0,
      angle: 45,
      azimuth: 0,
      distance: parseFloat(neo.close_approach_data[0]?.miss_distance.kilometers || 1000000),
      density: 2600
    }
    
    // Calculate mass from diameter and density
    const radius = asteroid.diameter / 2
    const volume = (4/3) * Math.PI * Math.pow(radius, 3)
    asteroid.mass = volume * asteroid.density

    set({ selectedNEO: neo, asteroid })
    get().calculateImpact()
    get().updateTrajectory()
  },

  reset: () => set({
    currentTime: 0,
    isPlaying: false,
    impactOccurred: false
  })
}))
