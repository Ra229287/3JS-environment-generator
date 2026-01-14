import { create } from 'zustand'
import type {
  QualityBenchmarks,
  GeneratedScene,
  GenerationStatus,
  PresetId,
  GenerationRequest,
} from '../types/procedural'
import { DEFAULT_BENCHMARKS, SCENE_PRESETS } from '../types/procedural'

interface ProceduralStore {
  // State
  prompt: string
  benchmarks: QualityBenchmarks
  style: 'realistic' | 'stylized' | 'minimal' | 'detailed'
  status: GenerationStatus
  generatedScene: GeneratedScene | null
  error: string | null
  history: GeneratedScene[]

  // Actions
  setPrompt: (prompt: string) => void
  setBenchmarks: (benchmarks: Partial<QualityBenchmarks>) => void
  setStyle: (style: 'realistic' | 'stylized' | 'minimal' | 'detailed') => void
  applyPreset: (presetId: PresetId) => void
  setStatus: (status: GenerationStatus) => void
  setGeneratedScene: (scene: GeneratedScene | null) => void
  setError: (error: string | null) => void
  addToHistory: (scene: GeneratedScene) => void
  clearHistory: () => void
  reset: () => void

  // Computed
  getGenerationRequest: () => GenerationRequest
}

export const useProceduralStore = create<ProceduralStore>((set, get) => ({
  // Initial state
  prompt: '',
  benchmarks: DEFAULT_BENCHMARKS,
  style: 'stylized',
  status: 'idle',
  generatedScene: null,
  error: null,
  history: [],

  // Actions
  setPrompt: (prompt) => set({ prompt }),

  setBenchmarks: (newBenchmarks) =>
    set((state) => ({
      benchmarks: { ...state.benchmarks, ...newBenchmarks },
    })),

  setStyle: (style) => set({ style }),

  applyPreset: (presetId) => {
    const preset = SCENE_PRESETS[presetId]
    set({ prompt: preset.prompt })
  },

  setStatus: (status) => set({ status }),

  setGeneratedScene: (scene) => set({ generatedScene: scene }),

  setError: (error) => set({ error }),

  addToHistory: (scene) =>
    set((state) => ({
      history: [scene, ...state.history].slice(0, 10), // Keep last 10
    })),

  clearHistory: () => set({ history: [] }),

  reset: () =>
    set({
      prompt: '',
      benchmarks: DEFAULT_BENCHMARKS,
      style: 'stylized',
      status: 'idle',
      generatedScene: null,
      error: null,
    }),

  // Computed
  getGenerationRequest: () => {
    const { prompt, benchmarks, style } = get()
    return { prompt, benchmarks, style }
  },
}))
