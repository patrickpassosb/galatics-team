import axios from 'axios'

/**
 * Load predefined impact scenarios
 */
export async function loadScenarios() {
  try {
    const response = await axios.get('/scenarios.json')
    return response.data.scenarios
  } catch (error) {
    console.error('Failed to load scenarios:', error)
    return []
  }
}

/**
 * Get scenario by ID
 */
export function getScenarioById(scenarios, id) {
  return scenarios.find(s => s.id === id)
}

/**
 * Apply scenario to simulation store
 */
export function applyScenario(scenario, store) {
  // Update asteroid parameters
  store.updateAsteroid(scenario.asteroid)
  
  // Set impact location
  store.setImpactLocation(scenario.impact.latitude, scenario.impact.longitude)
  
  // Calculate impact
  store.calculateImpact()
  store.updateTrajectory()
  
  return scenario
}

export default {
  loadScenarios,
  getScenarioById,
  applyScenario
}
