import React from 'react'
import { useSimulationStore } from '../store/simulationStore'

function ControlPanel() {
  const { neoData } = useSimulationStore()

  return (
    <div className='absolute top-20 right-4 w-96 bg-space-medium/90 backdrop-blur-sm 
                    rounded-lg shadow-2xl text-white p-4 max-h-[calc(100vh-6rem)] 
                    overflow-y-auto custom-scrollbar'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold mb-3'>NASA NEO Database</h3>
        {neoData && neoData.length > 0 ? (
          <div className='space-y-2'>
            {neoData.slice(0, 10).map(neo => (
              <div
                key={neo.id}
                className='p-3 bg-space-light rounded'
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
    </div>
  )
}

export default ControlPanel