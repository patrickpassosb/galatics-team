import React, { useState } from 'react'
import { Play, Pause, RotateCcw, Target, Eye, EyeOff } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'

function ControlPanel() {
  const {
    asteroid,
    impact,
    isPlaying,
    showTrajectory,
    showImpactZone,
    neoData,
    updateAsteroid,
    calculateImpact,
    updateTrajectory,
    togglePlay,
    toggleTrajectory,
    toggleImpactZone,
    selectNEO,
    reset
  } = useSimulationStore()

  const [activeTab, setActiveTab] = useState('asteroid')

  const handleAsteroidChange = (field, value) => {
    updateAsteroid({ [field]: parseFloat(value) })
  }

  const handleCalculate = () => {
    calculateImpact()
    updateTrajectory()
  }

  return (
    <div className='absolute top-20 right-4 w-96 bg-space-medium/90 backdrop-blur-sm 
                    rounded-lg shadow-2xl text-white p-4 max-h-[calc(100vh-6rem)] 
                    overflow-y-auto custom-scrollbar'>
      {/* Tabs */}
      <div className='flex gap-2 mb-4'>
        {['asteroid', 'nasa', 'simulation'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded capitalize transition-colors ${
              activeTab === tab
                ? 'bg-blue-600'
                : 'bg-space-light hover:bg-space-light/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Asteroid Parameters Tab */}
      {activeTab === 'asteroid' && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold mb-3'>Asteroid Parameters</h3>
          
          <div>
            <label className='block text-sm mb-1'>Diameter (meters)</label>
            <input
              type='range'
              min='10'
              max='10000'
              value={asteroid.diameter}
              onChange={(e) => handleAsteroidChange('diameter', e.target.value)}
              className='w-full'
            />
            <span className='text-sm text-gray-300'>{asteroid.diameter.toFixed(0)} m</span>
          </div>

          <div>
            <label className='block text-sm mb-1'>Velocity (km/s)</label>
            <input
              type='range'
              min='5'
              max='70'
              step='0.5'
              value={asteroid.velocity}
              onChange={(e) => handleAsteroidChange('velocity', e.target.value)}
              className='w-full'
            />
            <span className='text-sm text-gray-300'>{asteroid.velocity.toFixed(1)} km/s</span>
          </div>

          <div>
            <label className='block text-sm mb-1'>Impact Angle (degrees)</label>
            <input
              type='range'
              min='15'
              max='90'
              value={asteroid.angle}
              onChange={(e) => handleAsteroidChange('angle', e.target.value)}
              className='w-full'
            />
            <span className='text-sm text-gray-300'>{asteroid.angle.toFixed(0)}°</span>
          </div>

          <button
            onClick={handleCalculate}
            className='w-full bg-blue-600 hover:bg-blue-700 py-2 rounded flex items-center justify-center gap-2'
          >
            <Target size={18} />
            Calculate Impact
          </button>
        </div>
      )}

      {/* NASA Data Tab */}
      {activeTab === 'nasa' && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold mb-3'>NASA NEO Database</h3>
          {neoData && neoData.length > 0 ? (
            <div className='space-y-2'>
              {neoData.slice(0, 10).map(neo => (
                <div
                  key={neo.id}
                  onClick={() => selectNEO(neo)}
                  className='p-3 bg-space-light hover:bg-space-light/70 rounded cursor-pointer transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='font-semibold text-sm'>{neo.name}</div>
                    {neo.isPotentiallyHazardous && (
                      <span className='text-xs text-red-400'>⚠</span>
                    )}
                  </div>
                  <div className='text-xs text-gray-300 mt-1 space-y-0.5'>
                    <div>Diameter: {neo.diameter.average.toFixed(0)} m</div>
                    <div>Velocity: {neo.velocity.toFixed(1)} km/s</div>
                    <div>Distance: {(neo.distance / 1000).toFixed(0)}k km</div>
                    <div>Date: {neo.closeApproachDate}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-gray-400 text-sm'>Loading NASA data...</div>
          )}
        </div>
      )}

      {/* Simulation Controls Tab */}
      {activeTab === 'simulation' && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold mb-3'>Simulation Controls</h3>
          
          <div className='flex gap-2'>
            <button
              onClick={togglePlay}
              className='flex-1 bg-green-600 hover:bg-green-700 py-2 rounded flex items-center justify-center gap-2'
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={reset}
              className='flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded flex items-center justify-center gap-2'
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>

          <div className='space-y-2'>
            <button
              onClick={toggleTrajectory}
              className='w-full bg-space-light hover:bg-space-light/70 py-2 rounded flex items-center justify-center gap-2'
            >
              {showTrajectory ? <Eye size={18} /> : <EyeOff size={18} />}
              {showTrajectory ? 'Hide' : 'Show'} Trajectory
            </button>
            
            <button
              onClick={toggleImpactZone}
              className='w-full bg-space-light hover:bg-space-light/70 py-2 rounded flex items-center justify-center gap-2'
            >
              {showImpactZone ? <Eye size={18} /> : <EyeOff size={18} />}
              {showImpactZone ? 'Hide' : 'Show'} Impact Zone
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
