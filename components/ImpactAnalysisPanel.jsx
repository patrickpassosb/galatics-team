import React, { useState } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { ChevronDown, ChevronUp } from 'lucide-react'

function ImpactAnalysisPanel() {
  const { impact } = useSimulationStore()
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    crater: true,
    fireball: true,
    shock: true,
    wind: true,
    seismic: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (!impact.calculated) return null

  return (
    <div className='absolute top-20 left-4 z-10 w-80 max-h-[80vh] bg-gradient-to-br from-red-900/50 to-orange-900/40 
                    backdrop-blur-md rounded-xl shadow-2xl text-white border border-red-500/30 overflow-hidden'>
      
      {/* Header */}
      <div className='bg-red-900/60 p-4 border-b border-red-500/30 sticky top-0 z-10'>
        <h4 className='font-bold text-lg flex items-center gap-2'>
          <span className='text-2xl'>💥</span>
          Impact Analysis
        </h4>
        <p className='text-xs text-gray-300 mt-1'>Detailed impact effects assessment</p>
      </div>

      {/* Scrollable Content */}
      <div className='overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar'>
        
        {/* Summary Section */}
        <CollapsibleSection
          title="Summary"
          icon="📊"
          isExpanded={expandedSections.summary}
          onToggle={() => toggleSection('summary')}
        >
          <div className='space-y-2'>
            <MetricRow 
              label="Impact Energy" 
              value={`${impact.energy.toFixed(2)} MT TNT`}
              color="text-red-300"
              badge={impact.energyComparison}
            />
            <MetricRow 
              label="Crater Size" 
              value={`${impact.craterDiameter.toFixed(0)} m wide`}
              sublabel={`${(impact.craterDiameter / 1000).toFixed(1)} km / ${(impact.craterDiameter * 3.28084 / 5280).toFixed(1)} mi`}
            />
            <MetricRow 
              label="Earthquake" 
              value={`Magnitude ${impact.seismicMagnitude.toFixed(1)}`}
              color="text-purple-300"
            />
            <MetricRow 
              label="Airblast Radius" 
              value={`${impact.airblastRadius.toFixed(1)} km`}
              color="text-orange-300"
            />
            <MetricRow 
              label="Thermal Radius" 
              value={`${impact.thermalRadius.toFixed(1)} km`}
              color="text-yellow-300"
            />
          </div>
        </CollapsibleSection>

        {/* Crater Section */}
        <CollapsibleSection
          title="Crater"
          icon="🌋"
          isExpanded={expandedSections.crater}
          onToggle={() => toggleSection('crater')}
          subtitle={`${(impact.craterDiameter / 1000).toFixed(1)} km wide, ${(impact.craterDepth).toFixed(0)} m deep`}
        >
          <div className='space-y-2'>
            <InfoText 
              icon="📏"
              text={`Crater ${(impact.craterDiameter * 3.28084 / 5280).toFixed(2)} miles wide and ${(impact.craterDepth * 3.28084).toFixed(0)} feet deep`}
            />
            <MetricRow 
              label="Diameter" 
              value={`${(impact.craterDiameter / 1000).toFixed(2)} km`}
              sublabel={`${impact.craterDiameter.toFixed(0)} meters`}
            />
            <MetricRow 
              label="Depth" 
              value={`${impact.craterDepth.toFixed(0)} m`}
              sublabel={`${(impact.craterDepth * 3.28084).toFixed(0)} feet`}
            />
            <MetricRow 
              label="Volume Ejected" 
              value={`${(impact.craterVolume / 1e9).toFixed(2)} km³`}
              sublabel="Material excavated from impact"
            />
            <InfoText 
              icon="⚠️"
              text="Everything within crater instantly vaporized"
              color="text-red-400"
            />
          </div>
        </CollapsibleSection>

        {/* Fireball Section */}
        <CollapsibleSection
          title="Fireball"
          icon="🔥"
          isExpanded={expandedSections.fireball}
          onToggle={() => toggleSection('fireball')}
          subtitle={`${(impact.fireballDiameter / 1000).toFixed(1)} km diameter`}
        >
          <div className='space-y-2'>
            <InfoText 
              icon="☀️"
              text={`Fireball ${(impact.fireballDiameter / 1000 * 0.621371).toFixed(1)} miles wide, visible from ${(impact.burnRadius1st * 0.621371).toFixed(0)} miles away`}
            />
            <MetricRow 
              label="Fireball Diameter" 
              value={`${(impact.fireballDiameter / 1000).toFixed(2)} km`}
              sublabel={`${impact.fireballDiameter.toFixed(0)} meters`}
              color="text-orange-400"
            />
            <MetricRow 
              label="3rd Degree Burns" 
              value={`${impact.burnRadius3rd.toFixed(1)} km radius`}
              sublabel="Severe burns, likely fatal"
              color="text-red-400"
            />
            <MetricRow 
              label="2nd Degree Burns" 
              value={`${impact.burnRadius2nd.toFixed(1)} km radius`}
              sublabel="Painful burns, medical attention needed"
              color="text-orange-400"
            />
            <MetricRow 
              label="1st Degree Burns" 
              value={`${impact.burnRadius1st.toFixed(1)} km radius`}
              sublabel="Sunburn-like effects"
              color="text-yellow-400"
            />
            <InfoText 
              icon="👕"
              text={`Clothing ignites up to ${impact.burnRadius2nd.toFixed(1)} km away`}
            />
          </div>
        </CollapsibleSection>

        {/* Shock Wave Section */}
        <CollapsibleSection
          title="Shock Wave"
          icon="💨"
          isExpanded={expandedSections.shock}
          onToggle={() => toggleSection('shock')}
          subtitle={`${impact.peakOverpressure.toFixed(1)} PSI peak pressure`}
        >
          <div className='space-y-2'>
            <InfoText 
              icon="💥"
              text={`Peak pressure of ${impact.peakOverpressure.toFixed(0)} PSI - devastating blast wave`}
            />
            <MetricRow 
              label="Peak Overpressure" 
              value={`${impact.peakOverpressure.toFixed(1)} PSI`}
              sublabel="At crater rim"
              color="text-blue-400"
            />
            <MetricRow 
              label="Sound Level" 
              value={`${impact.peakDecibel.toFixed(0)} dB`}
              sublabel="Ear-shattering noise"
              color="text-cyan-400"
            />
            <MetricRow 
              label="Building Collapse" 
              value={`${impact.buildingCollapseRadius.toFixed(1)} km radius`}
              sublabel="Total structural failure (>20 PSI)"
              color="text-red-400"
            />
            <MetricRow 
              label="Glass Breakage" 
              value={`${impact.glassBreakageRadius.toFixed(1)} km radius`}
              sublabel="All windows shatter (>1 PSI)"
              color="text-blue-300"
            />
            <InfoText 
              icon="👂"
              text="Eardrums rupture within shock wave zone"
              color="text-yellow-400"
            />
          </div>
        </CollapsibleSection>

        {/* Wind Blast Section */}
        <CollapsibleSection
          title="Wind Blast"
          icon="🌪️"
          isExpanded={expandedSections.wind}
          onToggle={() => toggleSection('wind')}
          subtitle={`${impact.peakWindSpeed.toFixed(0)} km/h peak winds`}
        >
          <div className='space-y-2'>
            <InfoText 
              icon="💨"
              text={`Peak winds of ${impact.peakWindSpeedMph.toFixed(0)} mph - ${impact.windComparison}`}
            />
            <MetricRow 
              label="Peak Wind Speed" 
              value={`${impact.peakWindSpeed.toFixed(0)} km/h`}
              sublabel={`${impact.peakWindSpeedMph.toFixed(0)} mph`}
              color="text-cyan-400"
              badge={impact.windComparison}
            />
            <MetricRow 
              label="Tree Damage" 
              value={`${impact.treeDamageRadius.toFixed(1)} km radius`}
              sublabel="All trees uprooted or snapped"
              color="text-green-400"
            />
            <MetricRow 
              label="Airblast Zone" 
              value={`${impact.airblastRadius.toFixed(1)} km radius`}
              sublabel="Homes leveled, debris missiles"
              color="text-orange-400"
            />
            <InfoText 
              icon="🏠"
              text="Residential structures completely destroyed within blast radius"
              color="text-red-400"
            />
          </div>
        </CollapsibleSection>

        {/* Seismic Section */}
        <CollapsibleSection
          title="Earthquake"
          icon="🌍"
          isExpanded={expandedSections.seismic}
          onToggle={() => toggleSection('seismic')}
          subtitle={`Magnitude ${impact.seismicMagnitude.toFixed(1)} - ${impact.seismicComparison}`}
        >
          <div className='space-y-2'>
            <InfoText 
              icon="📊"
              text={`Magnitude ${impact.seismicMagnitude.toFixed(1)} earthquake - ${impact.seismicComparison}`}
            />
            <MetricRow 
              label="Richter Magnitude" 
              value={impact.seismicMagnitude.toFixed(1)}
              color="text-purple-400"
              badge={impact.seismicComparison}
            />
            <MetricRow 
              label="Felt Distance" 
              value={`${impact.feltDistance.toFixed(0)} km`}
              sublabel={`${(impact.feltDistance * 0.621371).toFixed(0)} miles`}
            />
            <InfoText 
              icon="🏚️"
              text="Severe ground shaking causes widespread structural damage"
            />
            <InfoText 
              icon="⚠️"
              text="Tsunami possible if impact occurs in ocean"
              color="text-blue-400"
            />
          </div>
        </CollapsibleSection>

        {/* Footer Note */}
        <div className='p-4 text-xs text-gray-400 border-t border-red-500/20'>
          <p>⚠️ Estimates based on impact scaling laws (Collins et al. 2005)</p>
          <p className='mt-1'>Click sections to expand/collapse details</p>
        </div>
      </div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({ title, icon, subtitle, isExpanded, onToggle, children }) {
  return (
    <div className='border-b border-red-500/20'>
      <button
        onClick={onToggle}
        className='w-full p-4 flex items-center justify-between hover:bg-red-900/30 transition-colors'
      >
        <div className='flex items-center gap-3 text-left'>
          <span className='text-2xl'>{icon}</span>
          <div>
            <h5 className='font-semibold text-base'>{title}</h5>
            {subtitle && <p className='text-xs text-gray-400 mt-0.5'>{subtitle}</p>}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div className='px-4 pb-4 space-y-2 animate-fadeIn'>
          {children}
        </div>
      )}
    </div>
  )
}

// Metric Row Component
function MetricRow({ label, value, sublabel, color = 'text-white', badge }) {
  return (
    <div className='bg-black/20 rounded-lg p-2'>
      <div className='flex justify-between items-start'>
        <span className='text-xs text-gray-400'>{label}</span>
        <span className={`text-sm font-semibold ${color}`}>{value}</span>
      </div>
      {sublabel && <p className='text-xs text-gray-500 mt-1'>{sublabel}</p>}
      {badge && (
        <div className='mt-1'>
          <span className='inline-block text-xs bg-orange-900/50 text-orange-200 px-2 py-0.5 rounded-full'>
            {badge}
          </span>
        </div>
      )}
    </div>
  )
}

// Info Text Component
function InfoText({ icon, text, color = 'text-gray-300' }) {
  return (
    <div className='flex gap-2 items-start bg-black/10 rounded p-2'>
      <span className='text-lg'>{icon}</span>
      <p className={`text-xs ${color} leading-relaxed`}>{text}</p>
    </div>
  )
}

export default ImpactAnalysisPanel