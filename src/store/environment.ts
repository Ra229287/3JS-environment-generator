import { create } from 'zustand'

// Partial types for nested config updates
type LightingUpdate = {
  ambient?: Partial<LightingConfig['ambient']>
  directional?: Partial<LightingConfig['directional']>
}

type BackgroundUpdate = {
  color?: string
  fog?: Partial<BackgroundConfig['fog']>
  stars?: Partial<BackgroundConfig['stars']>
}

export type FloorType = 'none' | 'grid' | 'solid' | 'platform'
export type TemplateId = 'void' | 'gridSpace' | 'platform' | 'office' | 'stage' | 'nature'

export interface FloorConfig {
  type: FloorType
  size: number
  color: string
  gridColor: string
  cellSize: number
}

export interface LightingConfig {
  ambient: {
    intensity: number
    color: string
  }
  directional: {
    intensity: number
    color: string
    position: [number, number, number]
    castShadow: boolean
  }
}

export interface BackgroundConfig {
  color: string
  fog: {
    enabled: boolean
    color: string
    near: number
    far: number
  }
  stars: {
    enabled: boolean
    count: number
    speed: number
  }
}

export interface PropConfig {
  id: string
  type: 'box' | 'sphere' | 'cylinder' | 'ring'
  position: [number, number, number]
  scale: [number, number, number]
  color: string
}

export interface EnvironmentConfig {
  template: TemplateId
  floor: FloorConfig
  lighting: LightingConfig
  background: BackgroundConfig
  props: PropConfig[]
  characterOffset: { x: number; y: number; z: number }
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

interface EnvironmentStore {
  config: EnvironmentConfig
  showCharacters: boolean

  // Actions
  setTemplate: (template: TemplateId) => void
  setFloor: (floor: Partial<FloorConfig>) => void
  setLighting: (lighting: LightingUpdate) => void
  setBackground: (background: BackgroundUpdate) => void
  addProp: (prop: PropConfig) => void
  removeProp: (id: string) => void
  toggleCharacters: () => void
  reset: () => void

  // Computed
  getMeshCount: () => number
  getLightCount: () => number
}

const defaultConfig: EnvironmentConfig = {
  template: 'gridSpace',
  floor: {
    type: 'grid',
    size: 30,
    color: '#1a1a2e',
    gridColor: '#00C49A',
    cellSize: 1,
  },
  lighting: {
    ambient: {
      intensity: 0.4,
      color: '#ffffff',
    },
    directional: {
      intensity: 1.0,
      color: '#ffffff',
      position: [10, 15, 10],
      castShadow: true,
    },
  },
  background: {
    color: '#050510',
    fog: {
      enabled: false,
      color: '#050510',
      near: 10,
      far: 50,
    },
    stars: {
      enabled: true,
      count: 2000,
      speed: 0.5,
    },
  },
  props: [],
  characterOffset: { x: 0, y: 0, z: 3 },
  cameraPosition: [0, 5, 12],
  cameraTarget: [0, 1, 3],
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  config: defaultConfig,
  showCharacters: false,

  setTemplate: (template) => {
    // Apply template presets
    const presets = getTemplatePreset(template)
    set({ config: { ...get().config, template, ...presets } })
  },

  setFloor: (floor) => {
    set((state) => ({
      config: {
        ...state.config,
        floor: { ...state.config.floor, ...floor },
      },
    }))
  },

  setLighting: (lighting) => {
    set((state) => ({
      config: {
        ...state.config,
        lighting: {
          ambient: lighting.ambient
            ? { ...state.config.lighting.ambient, ...lighting.ambient }
            : state.config.lighting.ambient,
          directional: lighting.directional
            ? { ...state.config.lighting.directional, ...lighting.directional }
            : state.config.lighting.directional,
        },
      },
    }))
  },

  setBackground: (background) => {
    set((state) => ({
      config: {
        ...state.config,
        background: {
          color: background.color ?? state.config.background.color,
          fog: background.fog
            ? { ...state.config.background.fog, ...background.fog }
            : state.config.background.fog,
          stars: background.stars
            ? { ...state.config.background.stars, ...background.stars }
            : state.config.background.stars,
        },
      },
    }))
  },

  addProp: (prop) => {
    set((state) => ({
      config: {
        ...state.config,
        props: [...state.config.props, prop],
      },
    }))
  },

  removeProp: (id) => {
    set((state) => ({
      config: {
        ...state.config,
        props: state.config.props.filter((p) => p.id !== id),
      },
    }))
  },

  toggleCharacters: () => {
    set((state) => ({ showCharacters: !state.showCharacters }))
  },

  reset: () => {
    set({ config: defaultConfig, showCharacters: false })
  },

  getMeshCount: () => {
    const { config } = get()
    let count = 0

    // Floor
    if (config.floor.type !== 'none') count += 1

    // Background stars
    if (config.background.stars.enabled) count += 1

    // Props
    count += config.props.length

    return count
  },

  getLightCount: () => {
    return 2 // ambient + directional (fixed for now)
  },
}))

// Template presets
function getTemplatePreset(template: TemplateId): Partial<EnvironmentConfig> {
  switch (template) {
    case 'void':
      return {
        floor: { type: 'none', size: 30, color: '#1a1a2e', gridColor: '#00C49A', cellSize: 1 },
        background: {
          color: '#000000',
          fog: { enabled: false, color: '#000000', near: 10, far: 50 },
          stars: { enabled: false, count: 0, speed: 0 },
        },
      }

    case 'gridSpace':
      return {
        floor: { type: 'grid', size: 30, color: '#1a1a2e', gridColor: '#00C49A', cellSize: 1 },
        background: {
          color: '#050510',
          fog: { enabled: false, color: '#050510', near: 10, far: 50 },
          stars: { enabled: true, count: 2000, speed: 0.5 },
        },
      }

    case 'platform':
      return {
        floor: { type: 'platform', size: 8, color: '#1a1a2e', gridColor: '#9D8CFF', cellSize: 1 },
        background: {
          color: '#0a0a15',
          fog: { enabled: true, color: '#0a0a15', near: 15, far: 40 },
          stars: { enabled: true, count: 3000, speed: 0.3 },
        },
      }

    default:
      return {}
  }
}
