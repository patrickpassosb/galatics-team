import React, { useState } from 'react'
import { Info, X, HelpCircle } from 'lucide-react'

function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeInfo, setActiveInfo] = useState('overview')

  const infoSections = {
    overview: {
      title: 'Overview',
      content: `This Earth Visualization provides an interactive 3D view of our planet using real NASA data. 
      Explore Earth's surface, view detailed textures, and learn about our planet's geography and features.`
    },
    earth: {
      title: 'Earth Features',
      content: `The Earth model displays:
      
• Realistic surface textures showing continents and oceans
• High-resolution imagery from NASA's Blue Marble project
• Interactive 3D navigation with mouse controls
• Enhanced lighting to show both day and night sides
• Beautiful starfield background

Use mouse controls to rotate, zoom, and pan around Earth.`
    },
    nasa: {
      title: 'NASA Data',
      content: `This visualization uses real NASA data including:
      
• Near-Earth Object (NEO) database
• High-resolution Earth imagery
• Scientific accuracy in planetary representation
• Real-time data from NASA's monitoring systems

The NASA NEO Database panel shows current asteroid information and close approaches to Earth.`
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
                      <li>Use mouse to rotate, zoom, and pan around Earth</li>
                      <li>Explore the NASA NEO Database for asteroid information</li>
                      <li>Enjoy the beautiful starfield background</li>
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