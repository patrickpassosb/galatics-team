﻿import { create } from 'zustand'
import { fetchNASANEOData } from '../services/nasaAPI'
import { calculateImpactParameters } from '../physics/orbitalMechanics'

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
    density: 3000, // kg/mÂ³ typical asteroid density
    materialType: 'rocky' // material type
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

  // Simulation state
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
    const impactParams = calculateImpactParameters(asteroid, impact)  // Pass both!
    set({ 
      impact: { 
        ...impactParams, 
        latitude: impact.latitude,
        longitude: impact.longitude,
        calculated: true 
      } 
    })
  },


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
    // Convert cleaned NASA NEO data to asteroid format
    const asteroid = {
      name: neo.name || 'Unknown Asteroid',
      diameter: neo.diameter.average || 100, // Use averaged diameter
      velocity: neo.velocity || 20,
      mass: 0,
      angle: 45, // Default impact angle
      azimuth: 0, // Default approach direction
      distance: neo.distance || 1000000,
      density: 3000, // Standard rocky asteroid density kg/m³
      materialType: 'rocky' // Default to rocky (most common type)
    }
    
    // Calculate mass from diameter and density (sphere approximation)
    const radius = asteroid.diameter / 2
    const volume = (4/3) * Math.PI * Math.pow(radius, 3)
    asteroid.mass = volume * asteroid.density

    set({ selectedNEO: neo, asteroid })
    
    // Auto-calculate impact with current location
    get().calculateImpact()
  },

  reset: () => set({
    impactOccurred: false
  })
}))