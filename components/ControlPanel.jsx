import React, { useState } from 'react'
import { Target, Info } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'

const MATERIAL_TYPES = [
  { id: 'icy', name: 'Icy', density: 1000, color: '#A5F3FC', tooltip: 'Comets, volatile-rich objects' },
  { id: 'carbonaceous', name: 'Carbonaceous', density: 1500, color: '#78716C', tooltip: 'C-type asteroids, carbon-rich' },
  { id: 'rocky', name: 'Rocky', density: 3000, color: '#D97706', tooltip: 'S-type asteroids, most common' },
  { id: 'iron', name: 'Iron', density: 8000, color: '#71717A', tooltip: 'M-type asteroids, metallic cores' },
  { id: 'custom', name: 'Custom', density: null, color: '#8B5CF6', tooltip: 'Custom density value' }
]

function ControlPanel() {
  const {
    asteroid,
    impact,
    showImpactZone,
    neoData,
    updateAsteroid,
    calculateImpact,
    toggleImpactZone,
    selectNEO
  } = useSimulationStore()

  const [activeTab, setActiveTab] = useState('asteroid')
  const [showTooltip, setShowTooltip] = useState(null)
  const [customDensity, setCustomDensity] = useState(2600)

  const handleAsteroidChange = (field, value) => {
    updateAsteroid({ [field]: parseFloat(value) })
  }

  const handleMaterialChange = (materialId) => {
    const material = MATERIAL_TYPES.find(m => m.id === materialId)
    if (material.density !== null) {
      updateAsteroid({ 
        materialType: materialId, 
        density: material.density 
      })
    } else {
      updateAsteroid({ materialType: materialId })
    }
  }

  const handleCustomDensityChange = (value) => {
    const density = parseFloat(value)
    setCustomDensity(density)
    if (asteroid.materialType === 'custom') {
      updateAsteroid({ density })
    }
  }

  const handleCalculate = () => {
    calculateImpact()
  }

  return (
    <div className='absolute top-20 right-4 w-96 bg-space-medium/90 backdrop-blur-sm 
                    rounded-lg shadow-2xl text-white p-4 max-h-[calc(100vh-6rem)] 
                    overflow-y-auto custom-scrollbar'>
      {/* Tabs */}
      <div className='flex gap-2 mb-4'>
        {['asteroid', 'nasa'].map(tab => (
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

          <div>
            <div className='flex items-center gap-2 mb-2'>
              <label className='block text-sm'>Density</label>
            </div>
            <div className='grid grid-cols-2 gap-2 mb-2'>
              {MATERIAL_TYPES.map(material => (
                <div key={material.id} className='relative'>
                  <button
                    onClick={() => handleMaterialChange(material.id)}
                    onMouseEnter={() => setShowTooltip(material.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                    className={`w-full px-3 py-2 rounded text-sm font-medium transition-all ${
                      asteroid.materialType === material.id
                        ? 'ring-2 ring-offset-2 ring-offset-space-medium'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: material.color,
                      color: material.id === 'icy' ? '#000' : '#fff',
                      ringColor: material.color
                    }}
                  >
                    {material.name}
                  </button>
                  {showTooltip === material.id && (
                    <div className='absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                    px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg 
                                    whitespace-nowrap pointer-events-none'>
                      {material.tooltip}
                      <div className='absolute top-full left-1/2 transform -translate-x-1/2 
                                      border-4 border-transparent border-t-gray-900'></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {asteroid.materialType === 'custom' ? (
              <div className='mt-2'>
                <label className='block text-sm mb-1'>Custom Density (kg/m³)</label>
                <input
                  type='number'
                  min='100'
                  max='10000'
                  step='100'
                  value={customDensity}
                  onChange={(e) => handleCustomDensityChange(e.target.value)}
                  className='w-full bg-space-light border border-gray-600 rounded px-3 py-2 text-white'
                />
              </div>
            ) : (
              <div className='text-xs text-gray-400 text-center'>
                Density: {asteroid.density} kg/m³
              </div>
            )}
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

    </div>
  )
}

export default ControlPanel
