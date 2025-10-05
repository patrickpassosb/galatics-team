import axios from 'axios'

// NASA API Configuration
const NASA_API_KEY = '0SS0PYXqmPsZl3TNmnPeuZamAMRuWDlei826hy0T' // Users should replace with their own key from https://api.nasa.gov
const NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed'

/**
 * Clean asteroid name (remove parentheses and extra info)
 */
function cleanAsteroidName(name) {
  // Remove parentheses and content inside
  return name.replace(/\([^)]*\)/g, '').trim()
}

/**
 * Fetch Near-Earth Object data from NASA API
 * Returns asteroid data for the current week
 */
export async function fetchNASANEOData() {
  try {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 7)

    const startDateStr = formatDate(today)
    const endDateStr = formatDate(endDate)

    const response = await axios.get(NEO_API_URL, {
      params: {
        start_date: startDateStr,
        end_date: endDateStr,
        api_key: NASA_API_KEY
      }
    })

    // Extract and format ONLY necessary NEO data for simulation
    const neoData = []
    const nearEarthObjects = response.data.near_earth_objects

    Object.keys(nearEarthObjects).forEach(date => {
      nearEarthObjects[date].forEach(neo => {
        // Get first close approach data
        const approach = neo.close_approach_data?.[0]
        if (!approach) return // Skip if no approach data
        
        // Calculate average diameter in meters
        const diameterMin = neo.estimated_diameter?.meters?.estimated_diameter_min || 0
        const diameterMax = neo.estimated_diameter?.meters?.estimated_diameter_max || 0
        const diameterAvg = (diameterMin + diameterMax) / 2
        
        // Extract only fields needed for simulation
        neoData.push({
          id: neo.id,
          name: cleanAsteroidName(neo.name),
          diameter: {
            min: diameterMin,
            max: diameterMax,
            average: diameterAvg
          },
          velocity: parseFloat(approach.relative_velocity?.kilometers_per_second) || 20,
          distance: parseFloat(approach.miss_distance?.kilometers) || 1000000,
          closeApproachDate: approach.close_approach_date || 'Unknown',
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid || false
        })
      })
    })

    // Sort by closest approach (smallest distance first)
    neoData.sort((a, b) => a.distance - b.distance)

    return neoData
  } catch (error) {
    console.error('NASA API Error:', error)
    // Return mock data if API fails
    return getMockNEOData()
  }
}

/**
 * Format date for NASA API (YYYY-MM-DD)
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Mock NEO data for testing when API is unavailable
 * Cleaned structure matching the API response
 */
function getMockNEOData() {
  return [
    {
      id: '2099942',
      name: 'Apophis',
      diameter: {
        min: 310,
        max: 700,
        average: 505
      },
      velocity: 7.4,
      distance: 31600,
      closeApproachDate: '2029-04-13',
      isPotentiallyHazardous: true
    },
    {
      id: '2000433',
      name: 'Eros',
      diameter: {
        min: 13000,
        max: 29000,
        average: 21000
      },
      velocity: 12.5,
      distance: 26000000,
      closeApproachDate: '2025-10-15',
      isPotentiallyHazardous: false
    },
    {
      id: '2101955',
      name: 'Bennu',
      diameter: {
        min: 480,
        max: 510,
        average: 495
      },
      velocity: 28.0,
      distance: 480000,
      closeApproachDate: '2026-09-25',
      isPotentiallyHazardous: true
    },
    {
      id: '2162173',
      name: 'Ryugu',
      diameter: {
        min: 850,
        max: 950,
        average: 900
      },
      velocity: 31.5,
      distance: 850000,
      closeApproachDate: '2027-03-10',
      isPotentiallyHazardous: false
    }
  ]
}

export default {
  fetchNASANEOData
}