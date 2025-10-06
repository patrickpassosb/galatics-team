import React, { useState, useEffect } from 'react'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import Header from './components/Header'
import InfoPanel from './components/InfoPanel'
import { useSimulationStore } from './store/simulationStore'

function App() {
  const [loading, setLoading] = useState(false)
  const { fetchNEOData } = useSimulationStore()

  useEffect(() => {
    // Load initial NASA NEO data
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await fetchNEOData()
      } catch (error) {
        console.error('Failed to load NASA data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [fetchNEOData])

  return (
    <div className="w-full h-screen bg-space-dark relative overflow-hidden">
      <Header />
      <Scene />
      <ControlPanel />
      <InfoPanel />
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-space-medium/90 backdrop-blur-sm p-6 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading NASA NEO Data...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
