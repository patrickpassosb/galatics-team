import React, { useState, useEffect } from 'react'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import Header from './components/Header'
import InfoPanel from './components/InfoPanel'
import ImpactAnalysisPanel from './components/ImpactAnalysisPanel'
import { useSimulationStore } from './store/simulationStore'

// Error boundary component to catch React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-space-dark flex items-center justify-center">
          <div className="text-white text-center p-8">
            <h2 className="text-2xl mb-4">Something went wrong</h2>
            <p className="mb-4">The application encountered an error and couldn't load properly.</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [loading, setLoading] = useState(false)
  const { fetchNEOData } = useSimulationStore()

  useEffect(() => {
    // Load initial asteroid data from NASA
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await fetchNEOData()
      } catch (error) {
        console.error('Failed to load NASA data:', error)
        // Continue anyway - the app should still work with default data
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [fetchNEOData])

  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-space-dark relative overflow-hidden">
        <Header />
        <Scene />
        <ImpactAnalysisPanel />
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
    </ErrorBoundary>
  )
}

export default App
