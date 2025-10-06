import axios from 'axios'

// NASA API Configuration
const NASA_API_KEY = '0SS0PYXqmPsZl3TNmnPeuZamAMRuWDlei826hy0T'
const NEO_API_URL = 'https://api.nasa.gov/neo/rest/v1/feed'

/**
 * Clean and format asteroid name
 */
function cleanAsteroidName(name) {
  if (!name) return 'Unknown Asteroid'
  
  // Remove parentheses and content inside
  let cleanName = name.replace(/\([^)]*\)/g, '').trim()
  
  // Format designation numbers more readably
  if (/^\d{4}\s[A-Z]{2,3}\d*$/.test(cleanName)) {
    cleanName = cleanName.replace(/(\d{4})\s([A-Z]{2,3})(\d*)/, '$1 $2$3')
  }
  
  return cleanName
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
 * Process NEO data from API response
 */
function processNEOData(nearEarthObjects) {
  const neoData = []

  Object.keys(nearEarthObjects).forEach(date => {
    nearEarthObjects[date].forEach(neo => {
      const approach = neo.close_approach_data?.[0]
      if (!approach) return
      
      const diameterMin = neo.estimated_diameter?.meters?.estimated_diameter_min || 0
      const diameterMax = neo.estimated_diameter?.meters?.estimated_diameter_max || 0
      const diameterAvg = (diameterMin + diameterMax) / 2
      
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

  return neoData.sort((a, b) => a.distance - b.distance)
}

/**
 * Famous asteroids mock data
 */
function getMockNEOData() {
  return [
    {
      id: '2099942',
      name: 'Apophis',
      diameter: { min: 310, max: 700, average: 505 },
      velocity: 7.4,
      distance: 31600,
      closeApproachDate: '2029-04-13',
      isPotentiallyHazardous: true
    },
    {
      id: '2101955',
      name: 'Bennu',
      diameter: { min: 480, max: 510, average: 495 },
      velocity: 28.0,
      distance: 480000,
      closeApproachDate: '2026-09-25',
      isPotentiallyHazardous: true
    },
    {
      id: '2000433',
      name: 'Eros',
      diameter: { min: 13000, max: 29000, average: 21000 },
      velocity: 12.5,
      distance: 26000000,
      closeApproachDate: '2025-10-15',
      isPotentiallyHazardous: false
    },
    {
      id: '2162173',
      name: 'Ryugu',
      diameter: { min: 850, max: 950, average: 900 },
      velocity: 31.5,
      distance: 850000,
      closeApproachDate: '2027-03-10',
      isPotentiallyHazardous: false
    },
    {
      id: '2000001',
      name: 'Ceres',
      diameter: { min: 950000, max: 950000, average: 950000 },
      velocity: 17.9,
      distance: 400000000,
      closeApproachDate: '2025-12-01',
      isPotentiallyHazardous: false
    },
    {
      id: '2000004',
      name: 'Vesta',
      diameter: { min: 525000, max: 525000, average: 525000 },
      velocity: 19.3,
      distance: 350000000,
      closeApproachDate: '2025-11-15',
      isPotentiallyHazardous: false
    },
    {
      id: '2000002',
      name: 'Pallas',
      diameter: { min: 512000, max: 512000, average: 512000 },
      velocity: 20.0,
      distance: 380000000,
      closeApproachDate: '2025-10-20',
      isPotentiallyHazardous: false
    },
    {
      id: '2000003',
      name: 'Juno',
      diameter: { min: 320000, max: 320000, average: 320000 },
      velocity: 18.2,
      distance: 320000000,
      closeApproachDate: '2025-09-30',
      isPotentiallyHazardous: false
    },
    {
      id: '2000005',
      name: 'Astraea',
      diameter: { min: 120000, max: 120000, average: 120000 },
      velocity: 16.8,
      distance: 280000000,
      closeApproachDate: '2025-08-25',
      isPotentiallyHazardous: false
    },
    {
      id: '2000006',
      name: 'Hebe',
      diameter: { min: 185000, max: 185000, average: 185000 },
      velocity: 17.5,
      distance: 300000000,
      closeApproachDate: '2025-07-10',
      isPotentiallyHazardous: false
    }
  ]
}

/**
 * Fetch Near-Earth Object data from NASA API
 */
export async function fetchNASANEOData() {
  try {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 7)

    const response = await axios.get(NEO_API_URL, {
      params: {
        start_date: formatDate(today),
        end_date: formatDate(endDate),
        api_key: NASA_API_KEY
      }
    })

    return processNEOData(response.data.near_earth_objects)
  } catch (error) {
    console.error('NASA API Error:', error)
    return getMockNEOData()
  }
}

export default { fetchNASANEOData }