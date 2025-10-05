# 🎯 Impact Target Usage Examples

## Quick Start

### Example 1: Basic Automatic Usage

The simplest way - just add to your Scene:

```jsx
import ImpactTarget from './components/ImpactTarget'

function Scene() {
  return (
    <Canvas>
      <Earth />
      <ImpactTarget />
    </Canvas>
  )
}
```

This automatically shows all calculated zones from the simulation store.

---

### Example 2: Custom Single Zone

Show just one custom zone:

```jsx
import { CustomImpactTarget } from './components/ImpactTarget'

<CustomImpactTarget
  center={{ lat: 51.5074, lon: -0.1278 }}  // London
  zones={[
    { 
      radiusKm: 500,
      color: '#ff0000',
      opacity: 0.5,
      outlineWidth: 2
    }
  ]}
/>
```

---

### Example 3: Multiple Custom Zones

Visualize nuclear blast zones:

```jsx
<CustomImpactTarget
  center={{ lat: 40.7128, lon: -74.0060 }}  // New York
  zones={[
    // Sorted largest to smallest for proper rendering
    {
      radiusKm: 50,
      color: '#ffff00',
      opacity: 0.2,
      label: 'Moderate Damage'
    },
    {
      radiusKm: 20,
      color: '#ff8800',
      opacity: 0.4,
      label: 'Heavy Damage'
    },
    {
      radiusKm: 5,
      color: '#ff0000',
      opacity: 0.7,
      label: 'Complete Destruction'
    }
  ]}
  showMarker={true}
/>
```

---

### Example 4: Animated Pulsing Zone

Add animation for emphasis:

```jsx
<CustomImpactTarget
  center={{ lat: 35.6762, lon: 139.6503 }}  // Tokyo
  zones={[
    { 
      radiusKm: 200,
      color: '#ff0000',
      opacity: 0.6
    }
  ]}
  animate={true}  // Pulse animation
/>
```

---

### Example 5: Individual Ring Component

Use ImpactZoneRing directly for maximum control:

```jsx
import ImpactZoneRing from './components/ImpactZoneRing'

<ImpactZoneRing
  center={{ lat: -33.8688, lon: 151.2093 }}  // Sydney
  radiusKm={300}
  color='#00ff00'
  opacity={0.5}
  lineWidth={3}
  filled={true}
  animate={false}
/>
```

---

### Example 6: Comparing Impact Scenarios

Show multiple impact locations simultaneously:

```jsx
<group>
  {/* Scenario 1: Small impact in ocean */}
  <CustomImpactTarget
    center={{ lat: 0, lon: -160 }}
    zones={[
      { radiusKm: 50, color: '#0088ff', opacity: 0.3 }
    ]}
  />
  
  {/* Scenario 2: Large impact on land */}
  <CustomImpactTarget
    center={{ lat: 48.8566, lon: 2.3522 }}  // Paris
    zones={[
      { radiusKm: 500, color: '#ff0000', opacity: 0.3 }
    ]}
  />
</group>
```

---

### Example 7: Visibility Toggle

Control visibility based on state:

```jsx
function ImpactVisualization() {
  const [showZones, setShowZones] = useState(true)
  const { impactCalculated } = useSimulationStore()
  
  return (
    <ImpactTarget 
      visible={showZones && impactCalculated}
      animate={false}
    />
  )
}
```

---

### Example 8: Gradient Ring Effect

Create multiple stacked rings for smooth edges:

```jsx
<group>
  {[1.0, 0.99, 0.98, 0.97].map((factor, i) => (
    <ImpactZoneRing
      key={i}
      center={{ lat: 40, lon: -74 }}
      radiusKm={500 * factor}
      color='#ff6600'
      opacity={0.6 - i * 0.15}
      filled={false}
      lineWidth={2}
    />
  ))}
</group>
```

---

### Example 9: Real NASA Asteroid Data

Connect to NASA NEO feed:

```jsx
function AsteroidImpactDemo() {
  const { selectedNEO, impact } = useSimulationStore()
  
  if (!selectedNEO) return null
  
  return (
    <CustomImpactTarget
      center={{ 
        lat: impact.latitude, 
        lon: impact.longitude 
      }}
      zones={[
        { 
          radiusKm: impact.thermalRadius,
          color: '#ffaa00',
          opacity: 0.3,
          label: `${selectedNEO.name} - Thermal Zone`
        },
        {
          radiusKm: impact.airblastRadius,
          color: '#ff6600',
          opacity: 0.4,
          label: 'Shock Wave'
        }
      ]}
    />
  )
}
```

---

### Example 10: Interactive Zone Selection

Let users choose which zones to display:

```jsx
function InteractiveImpact() {
  const [activeZones, setActiveZones] = useState({
    crater: true,
    thermal: true,
    shock: true
  })
  const { impact } = useSimulationStore()
  
  const zones = []
  
  if (activeZones.shock) {
    zones.push({
      radiusKm: impact.airblastRadius,
      color: '#ff6600',
      opacity: 0.4
    })
  }
  
  if (activeZones.thermal) {
    zones.push({
      radiusKm: impact.thermalRadius,
      color: '#ffaa00',
      opacity: 0.3
    })
  }
  
  if (activeZones.crater) {
    zones.push({
      radiusKm: impact.craterDiameter / 2000,
      color: '#ff0000',
      opacity: 0.6
    })
  }
  
  return (
    <>
      <CustomImpactTarget
        center={{ lat: impact.latitude, lon: impact.longitude }}
        zones={zones}
      />
      
      {/* UI controls */}
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={activeZones.crater}
            onChange={(e) => setActiveZones(prev => ({
              ...prev, 
              crater: e.target.checked
            }))}
          />
          Show Crater
        </label>
        {/* More controls... */}
      </div>
    </>
  )
}
```

---

### Example 11: Distance Measurement Tool

Measure distance from impact:

```jsx
import { greatCircleDistance } from './utils/geodesicMath'

function DistanceDisplay({ impactLat, impactLon, targetLat, targetLon }) {
  const distance = greatCircleDistance(
    impactLat, impactLon,
    targetLat, targetLon
  )
  
  return (
    <div>
      Distance from impact: {distance.toFixed(0)} km
      {distance < impact.thermalRadius && (
        <span style={{ color: 'red' }}>⚠️ In danger zone!</span>
      )}
    </div>
  )
}
```

---

### Example 12: Testing Different Locations

Quickly test various impact locations:

```jsx
const testLocations = [
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'North Pole', lat: 89, lon: 0 },
  { name: 'South Pole', lat: -89, lon: 0 }
]

function TestSuite() {
  const [selectedLocation, setSelectedLocation] = useState(0)
  const location = testLocations[selectedLocation]
  
  return (
    <>
      <CustomImpactTarget
        center={{ lat: location.lat, lon: location.lon }}
        zones={[
          { radiusKm: 500, color: '#ff0000', opacity: 0.5 }
        ]}
      />
      
      <select onChange={(e) => setSelectedLocation(e.target.value)}>
        {testLocations.map((loc, i) => (
          <option key={i} value={i}>{loc.name}</option>
        ))}
      </select>
    </>
  )
}
```

---

### Example 13: Combining with Other Effects

Integrate with impact effects:

```jsx
<group>
  {/* Show target before impact */}
  {!impactOccurred && (
    <ImpactTarget visible={true} animate={true} />
  )}
  
  {/* Show explosion after impact */}
  {impactOccurred && (
    <EnhancedImpactEffects />
  )}
  
  {/* Always show crater zone after impact */}
  {impactOccurred && (
    <ImpactZoneRing
      center={{ lat: impact.latitude, lon: impact.longitude }}
      radiusKm={impact.craterDiameter / 2000}
      color='#ff0000'
      opacity={0.8}
      filled={true}
    />
  )}
</group>
```

---

### Example 14: Performance-Optimized Mobile Version

Reduce complexity on mobile:

```jsx
function ResponsiveImpactTarget() {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
  const { impact } = useSimulationStore()
  
  // Show only 2 largest zones on mobile
  const zones = isMobile 
    ? [
        { 
          radiusKm: impact.thermalRadius,
          color: '#ffaa00',
          opacity: 0.3
        },
        {
          radiusKm: impact.airblastRadius,
          color: '#ff6600',
          opacity: 0.4
        }
      ]
    : [
        // Full 5 zones on desktop
        { radiusKm: impact.craterDiameter / 2000, color: '#ff0000', opacity: 0.6 },
        { radiusKm: impact.fireballRadius, color: '#ff3300', opacity: 0.5 },
        { radiusKm: impact.airblastRadius, color: '#ff6600', opacity: 0.4 },
        { radiusKm: impact.thermalRadius, color: '#ffaa00', opacity: 0.3 },
        { radiusKm: impact.seismicRadius, color: '#ffdd00', opacity: 0.2 }
      ]
  
  return (
    <CustomImpactTarget
      center={{ lat: impact.latitude, lon: impact.longitude }}
      zones={zones}
    />
  )
}
```

---

## 🎓 Educational Examples

### Example 15: Comparing Asteroid Sizes

Show how impact zone scales with asteroid size:

```jsx
const asteroidSizes = [
  { diameter: 50, color: '#00ff00', label: 'Small (50m)' },
  { diameter: 100, color: '#ffff00', label: 'Medium (100m)' },
  { diameter: 500, color: '#ff8800', label: 'Large (500m)' },
  { diameter: 1000, color: '#ff0000', label: 'Huge (1km)' }
]

function SizeComparison() {
  return (
    <group>
      {asteroidSizes.map((asteroid, i) => {
        // Simplified energy calculation
        const energy = Math.pow(asteroid.diameter, 3) * 0.001
        const thermalRadius = Math.pow(energy, 0.41) * 1.5
        
        return (
          <ImpactZoneRing
            key={i}
            center={{ lat: 40 + i * 2, lon: -74 }}  // Offset each
            radiusKm={thermalRadius}
            color={asteroid.color}
            opacity={0.3}
          />
        )
      })}
    </group>
  )
}
```

---

### Example 16: Historical Impact Recreations

Recreate famous impact events:

```jsx
const historicalImpacts = [
  {
    name: 'Tunguska Event (1908)',
    lat: 60.8833,
    lon: 101.9,
    airblastRadius: 30,
    thermalRadius: 10
  },
  {
    name: 'Chelyabinsk Meteor (2013)',
    lat: 55.1833,
    lon: 61.4,
    airblastRadius: 20,
    thermalRadius: 5
  }
]

<group>
  {historicalImpacts.map((event, i) => (
    <CustomImpactTarget
      key={i}
      center={{ lat: event.lat, lon: event.lon }}
      zones={[
        { radiusKm: event.thermalRadius, color: '#ffaa00', opacity: 0.4 },
        { radiusKm: event.airblastRadius, color: '#ff6600', opacity: 0.3 }
      ]}
      showMarker={true}
    />
  ))}
</group>
```

---

## 🔧 Advanced Customization

### Example 17: Custom Colors Based on Severity

```jsx
function getSeverityColor(radiusKm) {
  if (radiusKm < 50) return '#ffff00'   // Minor
  if (radiusKm < 200) return '#ff8800'  // Moderate
  if (radiusKm < 1000) return '#ff4400' // Major
  return '#ff0000'                      // Catastrophic
}

<ImpactZoneRing
  center={{ lat: 40, lon: -74 }}
  radiusKm={impact.thermalRadius}
  color={getSeverityColor(impact.thermalRadius)}
  opacity={0.5}
/>
```

---

### Example 18: Conditional Rendering Based on Impact Energy

```jsx
function EnergyBasedZones() {
  const { impact } = useSimulationStore()
  const energyMT = impact.energy // Megatons TNT
  
  return (
    <CustomImpactTarget
      center={{ lat: impact.latitude, lon: impact.longitude }}
      zones={[
        // Always show crater and thermal
        { radiusKm: impact.craterDiameter / 2000, color: '#ff0000', opacity: 0.6 },
        { radiusKm: impact.thermalRadius, color: '#ffaa00', opacity: 0.3 },
        
        // Only show global effects for large impacts
        ...(energyMT > 1000 ? [{
          radiusKm: 5000,
          color: '#ffdd00',
          opacity: 0.15,
          label: 'Global Effects'
        }] : [])
      ]}
    />
  )
}
```

---

## 💡 Tips & Best Practices

### 1. Zone Ordering
Always render largest zones first (sort descending by radius) to prevent overlapping issues.

### 2. Color Schemes
Use intuitive color progression:
- Red (hot/dangerous) → Orange → Yellow (cooler/safer)
- Higher opacity for smaller zones (more dangerous)

### 3. Performance
- Use fewer vertices (90-180) on mobile
- Disable filled zones if FPS drops
- Conditionally render zones based on zoom level

### 4. Accuracy
- Always use kilometers for radius
- Don't forget to convert crater diameter (meters) to radius (km)
- Use `greatCircleDistance()` to verify rendered sizes

### 5. User Experience
- Add labels or tooltips explaining each zone
- Use animation sparingly (can be distracting)
- Provide toggle controls for complex visualizations

---

## 📊 Common Parameters

### Typical Asteroid Impacts

| Asteroid Size | Thermal Radius | Airblast Radius | Seismic Magnitude |
|---------------|----------------|-----------------|-------------------|
| 50m (Tunguska) | ~10 km | ~30 km | 5.0 |
| 100m | ~50 km | ~100 km | 6.5 |
| 500m | ~500 km | ~800 km | 8.0 |
| 1 km (Global) | ~2000 km | ~3000 km | 9.5 |
| 10 km (Dinosaur) | ~10000 km | Half Earth | 12+ |

### Recommended Opacities

- Crater: 0.6-0.8 (most visible)
- Fireball: 0.5-0.6
- Airblast: 0.4-0.5
- Thermal: 0.3-0.4
- Seismic: 0.2-0.3 (least visible)

---

**More examples coming soon!**

Have a cool example? Contribute to the documentation!
