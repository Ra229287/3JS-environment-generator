import { useState } from 'react'
import { useEnvironmentStore, type TemplateId, type FloorType } from '../store/environment'
import { ExportModal } from './ExportModal'

// Panel wrapper component
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-surface-border">
      <h3 className="px-4 py-2 text-xs font-mono text-gray-500 uppercase tracking-wider bg-bg-tertiary">
        {title}
      </h3>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

// Slider input
function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500 font-mono">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-surface-border rounded-none appearance-none cursor-pointer accent-accent-primary"
      />
    </div>
  )
}

// Color picker
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 border border-surface-border cursor-pointer"
        />
        <span className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  )
}

// Toggle switch
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-gray-400">{label}</span>
      <div
        className={`relative w-8 h-4 rounded-none transition-colors ${
          checked ? 'bg-accent-primary' : 'bg-surface-border'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  )
}

// Template selector
function TemplateSelector() {
  const { template } = useEnvironmentStore((s) => s.config)
  const setTemplate = useEnvironmentStore((s) => s.setTemplate)

  const templates: { id: TemplateId; name: string; icon: string }[] = [
    { id: 'void', name: 'Void', icon: '⬛' },
    { id: 'gridSpace', name: 'Grid Space', icon: '🔲' },
    { id: 'platform', name: 'Platform', icon: '⭕' },
  ]

  return (
    <Panel title="Templates">
      <div className="space-y-1">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors ${
              template === t.id
                ? 'bg-accent-primary/20 text-accent-primary border-l-2 border-accent-primary'
                : 'hover:bg-surface-border/50 text-gray-400'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

// Floor configurator
function FloorConfigurator() {
  const { floor } = useEnvironmentStore((s) => s.config)
  const setFloor = useEnvironmentStore((s) => s.setFloor)

  const floorTypes: { id: FloorType; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'grid', name: 'Grid' },
    { id: 'solid', name: 'Solid' },
    { id: 'platform', name: 'Platform' },
  ]

  return (
    <Panel title="Floor">
      <div className="flex flex-wrap gap-1">
        {floorTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => setFloor({ type: t.id })}
            className={`px-2 py-1 text-xs font-mono transition-colors ${
              floor.type === t.id
                ? 'bg-accent-primary text-bg-primary'
                : 'bg-surface-border/50 text-gray-400 hover:bg-surface-border'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {floor.type !== 'none' && (
        <>
          <ColorPicker
            label="Color"
            value={floor.color}
            onChange={(color) => setFloor({ color })}
          />
          {floor.type === 'grid' && (
            <ColorPicker
              label="Grid Color"
              value={floor.gridColor}
              onChange={(gridColor) => setFloor({ gridColor })}
            />
          )}
          <Slider
            label="Size"
            value={floor.size}
            min={10}
            max={50}
            step={5}
            onChange={(size) => setFloor({ size })}
          />
        </>
      )}
    </Panel>
  )
}

// Lighting configurator
function LightingConfigurator() {
  const { lighting } = useEnvironmentStore((s) => s.config)
  const setLighting = useEnvironmentStore((s) => s.setLighting)

  return (
    <Panel title="Lighting">
      <Slider
        label="Ambient"
        value={lighting.ambient.intensity}
        min={0}
        max={1}
        onChange={(intensity) => setLighting({ ambient: { intensity } })}
      />
      <ColorPicker
        label="Ambient Color"
        value={lighting.ambient.color}
        onChange={(color) => setLighting({ ambient: { color } })}
      />
      <Slider
        label="Directional"
        value={lighting.directional.intensity}
        min={0}
        max={2}
        onChange={(intensity) => setLighting({ directional: { intensity } })}
      />
      <ColorPicker
        label="Light Color"
        value={lighting.directional.color}
        onChange={(color) => setLighting({ directional: { color } })}
      />
      <Toggle
        label="Shadows"
        checked={lighting.directional.castShadow}
        onChange={(castShadow) => setLighting({ directional: { castShadow } })}
      />
    </Panel>
  )
}

// Background configurator
function BackgroundConfigurator() {
  const { background } = useEnvironmentStore((s) => s.config)
  const setBackground = useEnvironmentStore((s) => s.setBackground)

  return (
    <Panel title="Background">
      <ColorPicker
        label="Color"
        value={background.color}
        onChange={(color) => setBackground({ color })}
      />
      <Toggle
        label="Stars"
        checked={background.stars.enabled}
        onChange={(enabled) => setBackground({ stars: { enabled } })}
      />
      {background.stars.enabled && (
        <Slider
          label="Star Count"
          value={background.stars.count}
          min={500}
          max={5000}
          step={500}
          onChange={(count) => setBackground({ stars: { count } })}
        />
      )}
      <Toggle
        label="Fog"
        checked={background.fog.enabled}
        onChange={(enabled) => setBackground({ fog: { enabled } })}
      />
      {background.fog.enabled && (
        <>
          <ColorPicker
            label="Fog Color"
            value={background.fog.color}
            onChange={(color) => setBackground({ fog: { color } })}
          />
          <Slider
            label="Fog Distance"
            value={background.fog.far}
            min={20}
            max={100}
            step={5}
            onChange={(far) => setBackground({ fog: { far } })}
          />
        </>
      )}
    </Panel>
  )
}

// Performance budget display
function PerformanceBudget() {
  const getMeshCount = useEnvironmentStore((s) => s.getMeshCount)
  const getLightCount = useEnvironmentStore((s) => s.getLightCount)

  const meshCount = getMeshCount()
  const lightCount = getLightCount()
  const maxMeshes = 50
  const maxLights = 6

  return (
    <div className="px-4 py-2 border-t border-surface-border bg-bg-tertiary">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono ${meshCount > maxMeshes * 0.8 ? 'text-yellow-500' : 'text-gray-500'}`}>
          Meshes: {meshCount}/{maxMeshes}
        </span>
        <span className={`font-mono ${lightCount > maxLights * 0.8 ? 'text-yellow-500' : 'text-gray-500'}`}>
          Lights: {lightCount}/{maxLights}
        </span>
      </div>
    </div>
  )
}

// Main Configurator component
export function Configurator() {
  const showCharacters = useEnvironmentStore((s) => s.showCharacters)
  const toggleCharacters = useEnvironmentStore((s) => s.toggleCharacters)
  const reset = useEnvironmentStore((s) => s.reset)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <TemplateSelector />
          <FloorConfigurator />
          <LightingConfigurator />
          <BackgroundConfigurator />
        </div>

        <PerformanceBudget />

        <footer className="p-4 border-t border-surface-border space-y-2">
          <div className="flex gap-2">
            <button
              onClick={toggleCharacters}
              className={`flex-1 py-1.5 px-2 text-xs font-mono transition-colors border ${
                showCharacters
                  ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary'
                  : 'border-surface-border text-gray-400 hover:border-gray-500'
              }`}
            >
              {showCharacters ? '👤 Hide' : '👤 Show'}
            </button>
            <button
              onClick={reset}
              className="flex-1 py-1.5 px-2 text-xs font-mono text-gray-400 border border-surface-border hover:border-gray-500 transition-colors"
            >
              Reset
            </button>
          </div>
          <button
            onClick={() => setExportOpen(true)}
            className="w-full py-2 px-4 bg-accent-primary text-bg-primary font-mono text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            Export Code
          </button>
        </footer>
      </div>

      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}