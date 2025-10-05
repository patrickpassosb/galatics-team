import React, { useState } from 'react'
import { useSimulationStore } from '../store/simulationStore'

function NumberInput({ label, value, onChange, step = 0.1, min = 0, max = 999, suffix = '' }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-sm text-gray-300'>{label}</span>
      <div className='flex items-center gap-2'>
        <input
          type='number'
          className='w-24 bg-space-light text-white px-2 py-1 rounded outline-none'
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {suffix && <span className='text-xs text-gray-400'>{suffix}</span>}
      </div>
    </div>
  )
}

function StrategyCard({ title, description, children, onApply }) {
  return (
    <div className='p-4 rounded-lg bg-space-dark border border-gray-700'>
      <h4 className='font-semibold text-white mb-1'>{title}</h4>
      <p className='text-xs text-gray-400 mb-3'>{description}</p>
      <div className='space-y-3'>{children}</div>
      <button
        className='mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded'
        onClick={onApply}
      >
        Apply Strategy
      </button>
    </div>
  )
}

function MitigationPanel() {
  const { applyMitigation } = useSimulationStore()
  const [kinetic, setKinetic] = useState({ deltaV: 0.02, azimuthChange: 1 })
  const [tractor, setTractor] = useState({ azimuthChange: 0.5, angleChange: 0.3 })
  const [nuclear, setNuclear] = useState({ deltaV: 0.1 })

  return (
    <div className='space-y-4'>
      <StrategyCard
        title='Kinetic Impactor'
        description='Impacts a spacecraft to change asteroid velocity and direction.'
        onApply={() => applyMitigation({ type: 'kinetic_impactor', ...kinetic })}
      >
        <NumberInput label='Delta-V' value={kinetic.deltaV} step={0.01} suffix='km/s' onChange={(v) => setKinetic(s => ({ ...s, deltaV: v }))} />
        <NumberInput label='Azimuth Change' value={kinetic.azimuthChange} step={0.1} suffix='°' onChange={(v) => setKinetic(s => ({ ...s, azimuthChange: v }))} />
      </StrategyCard>

      <StrategyCard
        title='Gravity Tractor'
        description='Uses spacecraft gravity to slowly alter trajectory.'
        onApply={() => applyMitigation({ type: 'gravity_tractor', ...tractor })}
      >
        <NumberInput label='Azimuth Change' value={tractor.azimuthChange} step={0.1} suffix='°' onChange={(v) => setTractor(s => ({ ...s, azimuthChange: v }))} />
        <NumberInput label='Angle Change' value={tractor.angleChange} step={0.1} suffix='°' onChange={(v) => setTractor(s => ({ ...s, angleChange: v }))} />
      </StrategyCard>

      <StrategyCard
        title='Nuclear Device'
        description='Last resort. Ablation and momentum transfer increase velocity.'
        onApply={() => applyMitigation({ type: 'nuclear_device', ...nuclear })}
      >
        <NumberInput label='Delta-V' value={nuclear.deltaV} step={0.05} suffix='km/s' onChange={(v) => setNuclear(s => ({ ...s, deltaV: v }))} />
      </StrategyCard>
    </div>
  )
}

export default MitigationPanel


