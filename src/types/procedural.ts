// Types for procedural generation

export interface QualityBenchmarks {
  maxPolygons: number      // Total polygon budget
  maxLights: number        // Maximum light sources
  maxObjects: number       // Maximum scene objects
  targetFPS: number        // Target frame rate
  materialComplexity: 'simple' | 'standard' | 'complex'
  shadowQuality: 'none' | 'low' | 'medium' | 'high'
}

export interface GeneratedObject {
  id: string
  type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'group'
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  material: {
    color: string
    metalness?: number
    roughness?: number
    emissive?: string
    emissiveIntensity?: number
    transparent?: boolean
    opacity?: number
  }
  castShadow?: boolean
  receiveShadow?: boolean
  children?: GeneratedObject[]
}

export interface GeneratedLight {
  id: string
  type: 'ambient' | 'directional' | 'point' | 'spot'
  color: string
  intensity: number
  position?: [number, number, number]
  target?: [number, number, number]
  castShadow?: boolean
  distance?: number
  angle?: number
  penumbra?: number
}

// Terrain configuration for procedural generation
export interface TerrainConfig {
  width: number
  depth: number
  segments: number
  heightScale: number
  seed?: number
  octaves?: number
  lacunarity?: number
  gain?: number
  biome?: 'plains' | 'mountains' | 'desert' | 'forest' | 'volcanic'
}

// Tree placement in scene
export interface TreePlacement {
  id: string
  type: 'oak' | 'pine' | 'willow' | 'bush' | 'palm'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}

// Rock placement in scene
export interface RockPlacement {
  id: string
  type: 'boulder' | 'jagged' | 'smooth' | 'flat'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}

// Grass configuration
export interface GrassConfig {
  enabled: boolean
  density?: number
  color?: string
}

// Vegetation configuration
export interface VegetationConfig {
  trees?: TreePlacement[]
  rocks?: RockPlacement[]
  grass?: GrassConfig
}

// Asset placement (for GLB models)
export interface AssetPlacement {
  id: string
  assetId: string  // Reference to asset library ID
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

export interface GeneratedScene {
  name: string
  description: string
  background: {
    color: string
    fog?: {
      color: string
      near: number
      far: number
    }
  }
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
  }
  lights: GeneratedLight[]
  objects: GeneratedObject[]
  // Enhanced procedural features
  terrain?: TerrainConfig
  vegetation?: VegetationConfig
  assets?: AssetPlacement[]
  metadata: {
    estimatedPolygons: number
    objectCount: number
    lightCount: number
    generatedAt: string
    prompt: string
  }
}

export interface GenerationRequest {
  prompt: string
  preset?: string
  benchmarks: QualityBenchmarks
  style?: 'realistic' | 'stylized' | 'minimal' | 'detailed'
}

export interface GenerationResult {
  success: boolean
  scene?: GeneratedScene
  error?: string
  suggestions?: string[]
}

export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'complete' | 'error'

// Preset configurations
export const SCENE_PRESETS = {
  forest: {
    name: 'Enchanted Forest',
    prompt: 'An enchanted forest clearing with procedural terrain, oak and pine trees, rocks, animated grass, and magical mushrooms. Dappled sunlight filtering through leaves.',
    icon: '🌲'
  },
  dragonCave: {
    name: "Dragon's Lair",
    prompt: "A dragon's cave lair with volcanic terrain, jagged rocks, treasure chests, glowing crystals, and gold piles. Dramatic fire lighting and mysterious atmosphere.",
    icon: '🐉'
  },
  sciFi: {
    name: 'Sci-Fi Lab',
    prompt: 'A futuristic science lab with holographic displays, glowing panels, cylindrical pods, and neon accent lighting. High-tech atmosphere.',
    icon: '🔬'
  },
  office: {
    name: 'Modern Office',
    prompt: 'A modern minimalist office space with a desk, ergonomic chair, computer setup, and ambient lighting. Clean lines and professional atmosphere.',
    icon: '🏢'
  },
  mountain: {
    name: 'Mountain Peak',
    prompt: 'A rugged mountain peak with procedural mountain terrain, pine trees at lower elevations, boulders, and snow-capped heights. Dramatic alpine lighting.',
    icon: '🏔️'
  },
  desert: {
    name: 'Desert Oasis',
    prompt: 'A desert oasis with sandy terrain, palm trees around a water source, flat rocks, and warm golden lighting. Serene and exotic atmosphere.',
    icon: '🏜️'
  }
} as const

export type PresetId = keyof typeof SCENE_PRESETS

// Default quality benchmarks
export const DEFAULT_BENCHMARKS: QualityBenchmarks = {
  maxPolygons: 50000,
  maxLights: 6,
  maxObjects: 30,
  targetFPS: 60,
  materialComplexity: 'standard',
  shadowQuality: 'medium'
}
