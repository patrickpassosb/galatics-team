import React from 'react'
import { useSimulationStore } from '../store/simulationStore'

function ImpactAnalysisPanel() {
  const { impact } = useSimulationStore()

  if (!impact.calculated) return null

  return (
    <div className='absolute top-20 left-4 z-10 w-64 max-w-[250px] bg-red-900/40 backdrop-blur-sm 
                    rounded-lg shadow-2xl text-white p-4 border border-red-500/30'>
      <h4 className='font-semibold mb-3 text-lg flex items-center gap-2'>
        <span className='text-red-400'>💥</span>
        Impact Analysis
      </h4>
      <div className='text-sm space-y-2'>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Energy:</span>
          <span className='font-semibold text-red-300'>{impact.energy.toFixed(2)} MT TNT</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Crater:</span>
          <span className='font-semibold'>{impact.craterDiameter.toFixed(0)} m</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Magnitude:</span>
          <span className='font-semibold'>{impact.seismicMagnitude.toFixed(1)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Airblast:</span>
          <span className='font-semibold text-orange-300'>{impact.airblastRadius.toFixed(1)} km</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-gray-300'>Thermal:</span>
          <span className='font-semibold text-yellow-300'>{impact.thermalRadius.toFixed(1)} km</span>
        </div>
      </div>
    </div>
  )
}

export default ImpactAnalysisPanel
