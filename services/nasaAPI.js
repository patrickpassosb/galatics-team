import axios from 'axios'

// NASA API Configuration
const NASA_API_KEY = 'DEMO_KEY' // Users should replace with their own key from https://api.nasa.gov
const NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed'

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

    // Extract and format NEO data
    const neoData = []
    const nearEarthObjects = response.data.near_earth_objects

    Object.keys(nearEarthObjects).forEach(date => {
      nearEarthObjects[date].forEach(neo => {
        neoData.push({
          id: neo.id,
          name: neo.name,
          nasa_jpl_url: neo.nasa_jpl_url,
          absolute_magnitude: neo.absolute_magnitude_h,
          estimated_diameter: neo.estimated_diameter,
          is_potentially_hazardous: neo.is_potentially_hazardous_asteroid,
          close_approach_data: neo.close_approach_data,
          orbital_data: neo.orbital_data
        })
      })
    })

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
 */
function getMockNEOData() {
  return [
    {
      id: '2000433',
      name: '433 Eros',
      nasa_jpl_url: 'http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2000433',
      absolute_magnitude: 10.4,
      estimated_diameter: {
        kilometers: {
          estimated_diameter_min: 13.0,
          estimated_diameter_max: 29.0
        },
        meters: {
          estimated_diameter_min: 13000.0,
          estimated_diameter_max: 29000.0
        }
      },
      is_potentially_hazardous: false,
      close_approach_data: [
        {
          close_approach_date: '2025-10-15',
          relative_velocity: {
            kilometers_per_second: '12.5',
            kilometers_per_hour: '45000'
          },
          miss_distance: {
            astronomical: '0.18',
            lunar: '70.0',
            kilometers: '26000000',
            miles: '16000000'
          }
        }
      ]
    },
    {
      id: '2099942',
      name: '99942 Apophis',
      nasa_jpl_url: 'http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=2099942',
      absolute_magnitude: 19.7,
      estimated_diameter: {
        kilometers: {
          estimated_diameter_min: 0.31,
          estimated_diameter_max: 0.70
        },
        meters: {
          estimated_diameter_min: 310.0,
          estimated_diameter_max: 700.0
        }
      },
      is_potentially_hazardous: true,
      close_approach_data: [
        {
          close_approach_date: '2029-04-13',
          relative_velocity: {
            kilometers_per_second: '7.4',
            kilometers_per_hour: '26640'
          },
          miss_distance: {
            astronomical: '0.0002',
            lunar: '0.078',
            kilometers: '31600',
            miles: '19600'
          }
        }
      ]
    }
  ]
}

export default {
  fetchNASANEOData
}
