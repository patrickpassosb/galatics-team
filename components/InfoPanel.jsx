import React, { useState } from 'react'
import { Info, X, HelpCircle } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'

function InfoPanel() {
  const { asteroid } = useSimulationStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeInfo, setActiveInfo] = useState('overview')

  const materialName = asteroid.materialType ? asteroid.materialType.charAt(0).toUpperCase() + asteroid.materialType.slice(1) : 'Unknown'
  const calculatedMass = ((4/3) * Math.PI * Math.pow(asteroid.diameter / 2, 3) * asteroid.density).toExponential(2)

  const infoSections = {
    overview: {
      title: 'Overview',
      content: `This simulator models asteroid impacts on Earth using real physics and NASA data. 
      Adjust asteroid parameters to see how size, velocity, and approach angle affect impact consequences.`
    },
    materials: {
      title: 'Material Properties',
      content: `Icy (1000 kg/m³): Comets and volatile-rich objects. Fragile, often break up in atmosphere.
      
Carbonaceous (1500 kg/m³): C-type asteroids, carbon-rich and relatively soft. Common in outer asteroid belt.

Rocky (3000 kg/m³): S-type asteroids made of silicate materials. Most common type of asteroid.

Iron (8000 kg/m³): M-type asteroids, metallic cores from differentiated parent bodies. Dense and resistant to atmospheric breakup.

Current Selection: ${materialName}
Density: ${asteroid.density} kg/m³
Calculated Mass: ${calculatedMass} kg`
    },
    physics: {
      title: 'Physics Models',
      content: `Impact energy is calculated using kinetic energy (E = 1/2 mvÂ²). Crater size follows 
      scaling laws based on projectile density, velocity, and angle. Seismic magnitude uses empirical 
      relationships between energy release and Richter scale.`
    },
    mitigation: {
      title: 'Mitigation Strategies',
      content: `Kinetic Impactor: Collide spacecraft with asteroid to change velocity.
      Gravity Tractor: Use spacecraft's gravity to slowly alter trajectory.
      Nuclear Device: Last resort option for large, imminent threats.
      Small velocity changes (cm/s) applied years in advance can deflect an asteroid enough to miss Earth.`
    },
    scenarios: {
      title: 'Example Scenarios',
      content: `Small (100m): City-scale destruction, regional effects.
      Medium (500m): Country-scale devastation, global climate effects.
      Large (1km+): Mass extinction event, global winter.
      The 1908 Tunguska event (~50m asteroid) flattened 2,000 kmÂ² of forest.`
    }
  }

  return (
    <>
      {/* Info button */}
      <button
        onClick={() => setIsOpen(true)}
        className='absolute bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white 
                   p-3 rounded-full shadow-lg transition-colors'
        title='Learn More'
      >
        <HelpCircle size={24} />
      </button>

      {/* Info panel */}
      {isOpen && (
        <div className='absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-space-medium w-full max-w-2xl m-4 rounded-lg shadow-2xl text-white max-h-[80vh] overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-700'>
              <div className='flex items-center gap-2'>
                <Info size={24} className='text-blue-400' />
                <h2 className='text-xl font-bold'>Information & Guide</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='hover:bg-space-light p-2 rounded transition-colors'
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className='flex h-[calc(80vh-5rem)]'>
              {/* Sidebar */}
              <div className='w-48 bg-space-dark p-4 space-y-2 overflow-y-auto'>
                {Object.keys(infoSections).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveInfo(key)}
                    className={`w-full text-left px-3 py-2 rounded capitalize transition-colors ${
                      activeInfo === key
                        ? 'bg-blue-600'
                        : 'hover:bg-space-light'
                    }`}
                  >
                    {infoSections[key].title}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className='flex-1 p-6 overflow-y-auto custom-scrollbar'>
                <h3 className='text-xl font-semibold mb-4'>
                  {infoSections[activeInfo].title}
                </h3>
                <p className='text-gray-300 whitespace-pre-line leading-relaxed'>
                  {infoSections[activeInfo].content}
                </p>

                {activeInfo === 'overview' && (
                  <div className='mt-6 p-4 bg-blue-900/30 rounded-lg'>
                    <h4 className='font-semibold mb-2'>Quick Start</h4>
                    <ol className='list-decimal list-inside space-y-2 text-sm text-gray-300'>
                      <li>Select an asteroid from NASA data or customize parameters</li>
                      <li>Click "Calculate Impact" to compute consequences</li>
                      <li>Press "Play" to watch the trajectory animation</li>
                      <li>Use mouse to rotate, zoom, and pan the 3D view</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InfoPanel
