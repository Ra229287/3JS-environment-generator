import { useState, useCallback, useEffect } from 'react'
import { useProceduralStore } from '../store/procedural'
import { SCENE_PRESETS, type PresetId } from '../types/procedural'
import {
  generateDemoScene,
  submitGenerationRequest,
  pollForResult,
  checkBridgeHealth
} from '../lib/claudeBridge'

// Preset button component
function PresetButton({
  presetId,
  active,
  onClick,
}: {
  presetId: PresetId
  active: boolean
  onClick: () => void
}) {
  const preset = SCENE_PRESETS[presetId]
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-all ${
        active
          ? 'bg-accent-primary/20 border border-accent-primary text-accent-primary'
          : 'bg-surface-border/30 border border-transparent text-gray-400 hover:bg-surface-border/50 hover:text-gray-300'
      }`}
    >
      <span className="text-lg">{preset.icon}</span>
      <span className="text-[10px] font-mono">{preset.name}</span>
    </button>
  )
}

// Quality slider component
function QualitySlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500 font-mono">{value}</span>
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

// Style selector
function StyleSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (style: 'realistic' | 'stylized' | 'minimal' | 'detailed') => void
}) {
  const styles = [
    { id: 'minimal', label: 'Minimal', icon: '◇' },
    { id: 'stylized', label: 'Stylized', icon: '◆' },
    { id: 'realistic', label: 'Realistic', icon: '●' },
    { id: 'detailed', label: 'Detailed', icon: '❖' },
  ] as const

  return (
    <div className="flex gap-1">
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => onChange(style.id)}
          className={`flex-1 py-1.5 px-2 text-xs font-mono transition-colors ${
            value === style.id
              ? 'bg-accent-secondary/20 border border-accent-secondary text-accent-secondary'
              : 'bg-surface-border/30 border border-transparent text-gray-400 hover:bg-surface-border/50'
          }`}
        >
          <span className="mr-1">{style.icon}</span>
          {style.label}
        </button>
      ))}
    </div>
  )
}

// Generation status indicator
function GenerationStatus({ status, error }: { status: string; error: string | null }) {
  if (status === 'idle') return null

  const statusConfig = {
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: 'Preparing request...' },
    generating: { color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', text: 'Generating scene...' },
    complete: { color: 'text-accent-primary', bg: 'bg-accent-primary/10', text: 'Generation complete!' },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', text: error || 'Generation failed' },
  }[status] || { color: 'text-gray-400', bg: 'bg-surface-border', text: 'Unknown status' }

  return (
    <div className={`p-3 ${statusConfig.bg} border-l-2 ${statusConfig.color.replace('text-', 'border-')}`}>
      <div className="flex items-center gap-2">
        {status === 'generating' && (
          <div className="w-3 h-3 border-2 border-accent-secondary border-t-transparent rounded-full animate-spin" />
        )}
        {status === 'complete' && <span>✓</span>}
        {status === 'error' && <span>✕</span>}
        <span className={`text-xs font-mono ${statusConfig.color}`}>{statusConfig.text}</span>
      </div>
    </div>
  )
}

// Main component
export function ProceduralGenerator() {
  const {
    prompt,
    benchmarks,
    style,
    status,
    error,
    setPrompt,
    setBenchmarks,
    setStyle,
    applyPreset,
    setStatus,
    setGeneratedScene,
    setError,
    addToHistory,
  } = useProceduralStore()

  const [activePreset, setActivePreset] = useState<PresetId | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bridgeConnected, setBridgeConnected] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')

  // Check bridge connection on mount
  useEffect(() => {
    checkBridgeHealth().then(setBridgeConnected)
    const interval = setInterval(() => {
      checkBridgeHealth().then(setBridgeConnected)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handlePresetClick = useCallback(
    (presetId: PresetId) => {
      setActivePreset(presetId)
      applyPreset(presetId)
    },
    [applyPreset]
  )

  const handleGenerate = useCallback(async () => {
    console.log('Generate clicked, prompt:', prompt, 'bridge:', bridgeConnected)

    if (!prompt.trim()) {
      setError('Please enter a description or select a preset')
      return
    }

    setStatus('generating')
    setError(null)
    setProgressMessage('Submitting request...')

    try {
      if (bridgeConnected) {
        // Use real bridge - submit request and poll for result
        console.log('Using bridge mode...')
        setProgressMessage('Request sent. Waiting for Claude Code...')

        const requestId = await submitGenerationRequest({ prompt, benchmarks, style })
        console.log('Request submitted:', requestId)

        setProgressMessage('Claude Code is generating your scene...')

        const result = await pollForResult(requestId, (msg) => {
          setProgressMessage(msg)
        })

        if (result.success && result.scene) {
          console.log('Scene received:', result.scene.name)
          setGeneratedScene(result.scene)
          addToHistory(result.scene)
          setStatus('complete')
          setProgressMessage('')
        } else {
          throw new Error(result.error || 'Generation failed')
        }
      } else {
        // Fallback to demo mode
        console.log('Using demo mode (bridge not connected)...')
        setProgressMessage('Bridge not connected. Using demo mode...')

        await new Promise((resolve) => setTimeout(resolve, 1000))

        const scene = generateDemoScene(prompt)
        console.log('Demo scene generated:', scene.name)
        setGeneratedScene(scene)
        addToHistory(scene)
        setStatus('complete')
        setProgressMessage('')
      }

      // Reset status after showing completion
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStatus('error')
      setProgressMessage('')
    }
  }, [prompt, benchmarks, style, bridgeConnected, setStatus, setError, setGeneratedScene, addToHistory])

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Prompt Input */}
        <div className="p-4 border-b border-surface-border">
          <label className="block text-xs font-mono text-gray-400 mb-2">Scene Description</label>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              setActivePreset(null)
            }}
            placeholder="Describe the 3D environment you want to create..."
            className="w-full h-24 p-3 bg-bg-primary border border-surface-border text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-accent-primary font-mono"
          />
        </div>

        {/* Presets */}
        <div className="p-4 border-b border-surface-border">
          <label className="block text-xs font-mono text-gray-400 mb-2">Quick Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SCENE_PRESETS) as PresetId[]).map((presetId) => (
              <PresetButton
                key={presetId}
                presetId={presetId}
                active={activePreset === presetId}
                onClick={() => handlePresetClick(presetId)}
              />
            ))}
          </div>
        </div>

        {/* Style Selection */}
        <div className="p-4 border-b border-surface-border">
          <label className="block text-xs font-mono text-gray-400 mb-2">Generation Style</label>
          <StyleSelector value={style} onChange={setStyle} />
        </div>

        {/* Advanced Settings */}
        <div className="border-b border-surface-border">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-3 flex items-center justify-between text-xs font-mono text-gray-400 hover:bg-surface-border/30 transition-colors"
          >
            <span>Quality Benchmarks</span>
            <span className="text-gray-600">{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4">
              <QualitySlider
                label="Max Polygons"
                value={benchmarks.maxPolygons}
                min={10000}
                max={100000}
                step={5000}
                onChange={(v) => setBenchmarks({ maxPolygons: v })}
              />
              <QualitySlider
                label="Max Objects"
                value={benchmarks.maxObjects}
                min={10}
                max={50}
                step={5}
                onChange={(v) => setBenchmarks({ maxObjects: v })}
              />
              <QualitySlider
                label="Max Lights"
                value={benchmarks.maxLights}
                min={2}
                max={10}
                step={1}
                onChange={(v) => setBenchmarks({ maxLights: v })}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Shadow Quality</label>
                <div className="flex gap-1">
                  {(['none', 'low', 'medium', 'high'] as const).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setBenchmarks({ shadowQuality: quality })}
                      className={`flex-1 py-1 text-xs font-mono transition-colors ${
                        benchmarks.shadowQuality === quality
                          ? 'bg-accent-primary text-bg-primary'
                          : 'bg-surface-border/50 text-gray-400 hover:bg-surface-border'
                      }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <GenerationStatus status={status} error={error} />
      </div>

      {/* Generate Button */}
      <footer className="p-4 border-t border-surface-border space-y-2">
        {/* Bridge Status */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gray-500">Bridge Status:</span>
          <span className={bridgeConnected ? 'text-accent-primary' : 'text-yellow-500'}>
            {bridgeConnected ? '● Connected' : '○ Demo Mode'}
          </span>
        </div>

        {/* Progress Message */}
        {progressMessage && (
          <div className="text-xs text-accent-secondary font-mono animate-pulse">
            {progressMessage}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={status === 'generating' || !prompt.trim()}
          className={`w-full py-3 px-4 font-mono text-sm font-medium transition-all ${
            status === 'generating'
              ? 'bg-accent-secondary/50 text-bg-primary cursor-wait'
              : !prompt.trim()
              ? 'bg-surface-border text-gray-500 cursor-not-allowed'
              : 'bg-accent-secondary text-bg-primary hover:bg-accent-secondary/90'
          }`}
        >
          {status === 'generating' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            '⚡ Generate Scene'
          )}
        </button>

        <p className="text-[10px] text-gray-600 text-center mt-2 font-mono">
          {bridgeConnected
            ? 'Powered by Claude Code • Bridge connected'
            : 'Start bridge server: node server.js'}
        </p>
      </footer>
    </div>
  )
}
