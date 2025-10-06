import { create } from 'zustand'
import { fetchNASANEOData } from '../services/nasaAPI'

export const useSimulationStore = create((set) => ({
  neoData: null,

  fetchNEOData: async () => {
    try {
      const data = await fetchNASANEOData()
      set({ neoData: data })
      return data
    } catch (error) {
      console.error('Failed to fetch NEO data:', error)
      throw error
    }
  }
}))