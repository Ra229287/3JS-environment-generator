import type { GenerationRequest, GeneratedScene, GenerationResult } from '../types/procedural'

// Bridge configuration
export const BRIDGE_CONFIG = {
  apiUrl: 'http://localhost:3001',
  pollInterval: 1000,
  maxPollTime: 120000, // 2 minutes max
}

// System prompt for Claude to generate enhanced 3D scenes
export const SCENE_GENERATION_SYSTEM_PROMPT = `You are an expert 3D scene designer for Three.js/React Three Fiber applications.
Generate detailed scene specifications in JSON format based on user descriptions.

This system supports ENHANCED PROCEDURAL GENERATION:
- Procedural terrain with different biomes
- L-system based trees (oak, pine, willow, bush, palm)
- Procedural rocks (boulder, jagged, smooth, flat)
- Animated grass patches
- Asset library for props (furniture, vehicles, fantasy items)

RULES:
1. For outdoor/nature scenes, USE TERRAIN AND VEGETATION instead of primitives
2. For indoor scenes or specific objects, use primitives (box, sphere, cylinder, etc.)
3. Position objects logically in 3D space (y=0 is ground level)
4. Use realistic proportions (1 unit ≈ 1 meter)
5. Colors in hex format (#RRGGBB)
6. Respect the quality benchmarks provided
7. Include appropriate lighting for the scene mood
8. Camera should frame the scene nicely

OUTPUT FORMAT (JSON):
{
  "name": "Scene Name",
  "description": "Brief description",
  "background": {
    "color": "#hex",
    "fog": { "color": "#hex", "near": number, "far": number }
  },
  "camera": {
    "position": [x, y, z],
    "target": [x, y, z],
    "fov": number
  },
  "lights": [
    {
      "id": "unique-id",
      "type": "ambient|directional|point|spot",
      "color": "#hex",
      "intensity": number,
      "position": [x, y, z],
      "castShadow": boolean
    }
  ],

  // ENHANCED: Procedural terrain (for outdoor scenes)
  "terrain": {
    "width": 30,
    "depth": 30,
    "segments": 64,
    "heightScale": 3,
    "biome": "plains|mountains|desert|forest|volcanic",
    "seed": 12345
  },

  // ENHANCED: Procedural vegetation
  "vegetation": {
    "trees": [
      {
        "id": "tree-1",
        "type": "oak|pine|willow|bush|palm",
        "position": [x, y, z],
        "scale": 1.0,
        "seed": 12345
      }
    ],
    "rocks": [
      {
        "id": "rock-1",
        "type": "boulder|jagged|smooth|flat",
        "position": [x, y, z],
        "scale": 1.0
      }
    ],
    "grass": {
      "enabled": true,
      "density": 100,
      "color": "#3a5f0b"
    }
  },

  // ENHANCED: Asset library items (for props)
  "assets": [
    {
      "id": "asset-1",
      "assetId": "chest-01|barrel-01|crystal-01|etc",
      "position": [x, y, z],
      "scale": 1.0
    }
  ],

  // Standard primitive objects (for specific items not in procedural system)
  "objects": [
    {
      "id": "unique-id",
      "type": "box|sphere|cylinder|cone|plane|torus",
      "name": "Object Name",
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [x, y, z],
      "material": {
        "color": "#hex",
        "metalness": 0-1,
        "roughness": 0-1,
        "emissive": "#hex",
        "emissiveIntensity": number
      },
      "castShadow": boolean,
      "receiveShadow": boolean
    }
  ],
  "metadata": {
    "estimatedPolygons": number,
    "objectCount": number,
    "lightCount": number
  }
}

AVAILABLE ASSETS (use these IDs in assets[].assetId):
- Vegetation: tree-oak-01, tree-pine-01, bush-01, flower-01
- Rocks: rock-large-01, rock-small-01
- Props: barrel-01, crate-01, chest-01, lamp-post-01
- Fantasy: crystal-01, mushroom-01
- Sci-Fi: console-scifi-01, crate-scifi-01
- Furniture: chair-01, table-01, desk-01
- Buildings: house-small-01, tower-01
- Vehicles: car-01

SCENE TYPE GUIDELINES:

For OUTDOOR/NATURE scenes (forest, mountain, field, cave exterior):
- ALWAYS include "terrain" with appropriate biome
- Use "vegetation.trees" and "vegetation.rocks" for natural elements
- Enable "vegetation.grass" for grassy areas
- Use "assets" for additional props like chests, crystals
- Keep "objects" minimal (only for specific man-made items)

For FANTASY/ADVENTURE scenes (cave, dungeon, dragon's lair):
- Use terrain with volcanic/mountains biome
- Add rocks liberally
- Include crystal-01, chest-01, barrel-01 from assets
- Use dramatic lighting with point lights for atmosphere

For INDOOR scenes (office, room, lab):
- Skip terrain and vegetation
- Use "objects" for furniture and walls
- Use "assets" for props like chairs, tables
- Focus on lighting design

STYLE GUIDELINES:
- realistic: Detailed terrain, proper lighting, grounded proportions
- stylized: Bold colors, simplified shapes, artistic interpretation
- minimal: Clean terrain, few trees, lots of open space
- detailed: Dense vegetation, many rocks, rich atmosphere`

// Format the generation prompt for Claude
export function formatGenerationPrompt(request: GenerationRequest): string {
  const { prompt, benchmarks, style } = request

  return `Generate a 3D scene with the following specifications:

SCENE DESCRIPTION:
${prompt}

STYLE: ${style || 'stylized'}

QUALITY BENCHMARKS:
- Maximum polygons: ${benchmarks.maxPolygons}
- Maximum lights: ${benchmarks.maxLights}
- Maximum objects: ${benchmarks.maxObjects}
- Material complexity: ${benchmarks.materialComplexity}
- Shadow quality: ${benchmarks.shadowQuality}

Generate a complete JSON scene specification following the format in your instructions.
Ensure the scene is visually interesting and respects all constraints.
Return ONLY the JSON, no additional text.`
}

// Submit generation request to bridge server
export async function submitGenerationRequest(request: GenerationRequest): Promise<string> {
  const response = await fetch(`${BRIDGE_CONFIG.apiUrl}/api/generation/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error('Failed to submit generation request')
  }

  const data = await response.json()
  return data.requestId
}

// Poll for generation result
export async function pollForResult(requestId: string, onProgress?: (status: string) => void): Promise<GenerationResult> {
  const startTime = Date.now()

  while (Date.now() - startTime < BRIDGE_CONFIG.maxPollTime) {
    try {
      const response = await fetch(`${BRIDGE_CONFIG.apiUrl}/api/generation/result`)
      const data = await response.json()

      if (data.hasResult) {
        if (data.success && data.scene) {
          return { success: true, scene: data.scene }
        } else {
          return { success: false, error: data.error || 'Generation failed' }
        }
      }

      onProgress?.('Waiting for Claude to generate scene...')
    } catch (err) {
      console.error('Poll error:', err)
    }

    await new Promise(resolve => setTimeout(resolve, BRIDGE_CONFIG.pollInterval))
  }

  return { success: false, error: 'Generation timed out. Make sure Claude Code is processing the request.' }
}

// Check if bridge server is running
export async function checkBridgeHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BRIDGE_CONFIG.apiUrl}/api/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}

// Example scenes for fallback/demo mode - now with enhanced procedural features
export const EXAMPLE_SCENES: Record<string, GeneratedScene> = {
  // Indoor scene (office) - uses primitives
  office: {
    name: 'Modern Office',
    description: 'A minimalist office space with essential furniture',
    background: {
      color: '#1a1a2e',
      fog: { color: '#1a1a2e', near: 15, far: 40 }
    },
    camera: {
      position: [8, 6, 8],
      target: [0, 1, 0],
      fov: 50
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#ffffff', intensity: 0.4 },
      { id: 'dir-1', type: 'directional', color: '#ffffff', intensity: 1.0, position: [5, 10, 5], castShadow: true },
      { id: 'point-1', type: 'point', color: '#00C49A', intensity: 0.5, position: [0, 3, 0], castShadow: false }
    ],
    objects: [
      { id: 'floor', type: 'box', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [12, 0.1, 12], material: { color: '#2a2a3e', metalness: 0.1, roughness: 0.8 }, receiveShadow: true },
      { id: 'desk-top', type: 'box', name: 'Desk Top', position: [0, 0.75, 0], rotation: [0, 0, 0], scale: [2, 0.05, 1], material: { color: '#4a3728', metalness: 0.2, roughness: 0.6 }, castShadow: true, receiveShadow: true },
      { id: 'desk-leg-1', type: 'box', name: 'Desk Leg', position: [-0.9, 0.375, -0.4], rotation: [0, 0, 0], scale: [0.05, 0.75, 0.05], material: { color: '#333333', metalness: 0.8, roughness: 0.2 }, castShadow: true },
      { id: 'desk-leg-2', type: 'box', name: 'Desk Leg', position: [0.9, 0.375, -0.4], rotation: [0, 0, 0], scale: [0.05, 0.75, 0.05], material: { color: '#333333', metalness: 0.8, roughness: 0.2 }, castShadow: true },
      { id: 'monitor-screen', type: 'box', name: 'Monitor', position: [0, 1.2, -0.3], rotation: [0, 0, 0], scale: [0.8, 0.5, 0.03], material: { color: '#111111', metalness: 0.5, roughness: 0.3, emissive: '#00C49A', emissiveIntensity: 0.1 }, castShadow: true },
      { id: 'chair-seat', type: 'box', name: 'Chair Seat', position: [0, 0.45, 0.8], rotation: [0, 0, 0], scale: [0.5, 0.08, 0.5], material: { color: '#1a1a1a', metalness: 0.1, roughness: 0.9 }, castShadow: true },
    ],
    metadata: {
      estimatedPolygons: 1200,
      objectCount: 6,
      lightCount: 3,
      generatedAt: new Date().toISOString(),
      prompt: 'Modern office workspace'
    }
  },

  // Outdoor scene (forest) - uses enhanced procedural terrain + vegetation
  forest: {
    name: 'Enchanted Forest',
    description: 'A magical forest clearing with procedural trees and terrain',
    background: {
      color: '#1a2a1a',
      fog: { color: '#1a3a1a', near: 8, far: 30 }
    },
    camera: {
      position: [10, 6, 10],
      target: [0, 1, 0],
      fov: 55
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#3a5f3a', intensity: 0.4 },
      { id: 'dir-1', type: 'directional', color: '#ffffaa', intensity: 1.2, position: [8, 15, 8], castShadow: true },
      { id: 'point-1', type: 'point', color: '#88ff88', intensity: 0.5, position: [0, 2, 0], castShadow: false }
    ],
    terrain: {
      width: 30,
      depth: 30,
      segments: 64,
      heightScale: 2,
      biome: 'forest',
      seed: 42
    },
    vegetation: {
      trees: [
        { id: 'tree-1', type: 'oak', position: [-5, 0, -5], scale: 1.2, seed: 101 },
        { id: 'tree-2', type: 'oak', position: [6, 0, -3], scale: 1.0, seed: 102 },
        { id: 'tree-3', type: 'pine', position: [-7, 0, 4], scale: 1.5, seed: 103 },
        { id: 'tree-4', type: 'pine', position: [4, 0, 6], scale: 1.3, seed: 104 },
        { id: 'tree-5', type: 'willow', position: [0, 0, -8], scale: 1.1, seed: 105 },
        { id: 'tree-6', type: 'bush', position: [-3, 0, 2], scale: 0.8, seed: 106 },
        { id: 'tree-7', type: 'bush', position: [2, 0, 3], scale: 0.7, seed: 107 },
      ],
      rocks: [
        { id: 'rock-1', type: 'boulder', position: [-2, 0, -2], scale: 0.8, seed: 201 },
        { id: 'rock-2', type: 'jagged', position: [3, 0, -4], scale: 0.6, seed: 202 },
        { id: 'rock-3', type: 'smooth', position: [-4, 0, 1], scale: 0.5, seed: 203 },
        { id: 'rock-4', type: 'flat', position: [1, 0, 5], scale: 1.0, seed: 204 },
      ],
      grass: {
        enabled: true,
        density: 120,
        color: '#3a5f0b'
      }
    },
    assets: [
      { id: 'asset-1', assetId: 'mushroom-01', position: [-1, 0, 1], scale: 1.2 },
      { id: 'asset-2', assetId: 'flower-01', position: [2, 0, -1], scale: 1.0 },
    ],
    objects: [],
    metadata: {
      estimatedPolygons: 15000,
      objectCount: 0,
      lightCount: 3,
      generatedAt: new Date().toISOString(),
      prompt: 'Enchanted forest clearing'
    }
  },

  // Fantasy scene (dragon's cave) - uses volcanic terrain + rocks + fantasy assets
  dragonCave: {
    name: "Dragon's Lair",
    description: 'A volcanic cave filled with treasure and crystals',
    background: {
      color: '#1a0a05',
      fog: { color: '#2a1510', near: 5, far: 25 }
    },
    camera: {
      position: [8, 5, 8],
      target: [0, 1, 0],
      fov: 60
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#331100', intensity: 0.3 },
      { id: 'dir-1', type: 'directional', color: '#ff6633', intensity: 0.6, position: [5, 10, 5], castShadow: true },
      { id: 'point-1', type: 'point', color: '#ff3300', intensity: 1.5, position: [0, 2, 0], castShadow: true },
      { id: 'point-2', type: 'point', color: '#ffaa00', intensity: 1.0, position: [-3, 1, 2], castShadow: false },
      { id: 'point-3', type: 'point', color: '#00ffff', intensity: 0.8, position: [3, 1.5, -2], castShadow: false }
    ],
    terrain: {
      width: 25,
      depth: 25,
      segments: 48,
      heightScale: 3,
      biome: 'volcanic',
      seed: 666
    },
    vegetation: {
      trees: [],
      rocks: [
        { id: 'rock-1', type: 'jagged', position: [-4, 0, -4], scale: 1.5, seed: 301 },
        { id: 'rock-2', type: 'jagged', position: [5, 0, -3], scale: 1.8, seed: 302 },
        { id: 'rock-3', type: 'boulder', position: [-3, 0, 3], scale: 1.2, seed: 303 },
        { id: 'rock-4', type: 'jagged', position: [4, 0, 4], scale: 1.4, seed: 304 },
        { id: 'rock-5', type: 'boulder', position: [0, 0, -5], scale: 2.0, seed: 305 },
        { id: 'rock-6', type: 'jagged', position: [-6, 0, 0], scale: 1.6, seed: 306 },
      ],
      grass: {
        enabled: false
      }
    },
    assets: [
      { id: 'asset-1', assetId: 'chest-01', position: [0, 0.5, 0], scale: 1.5 },
      { id: 'asset-2', assetId: 'crystal-01', position: [-2, 0, 1], scale: 1.2 },
      { id: 'asset-3', assetId: 'crystal-01', position: [2, 0, -1], scale: 0.8 },
      { id: 'asset-4', assetId: 'crystal-01', position: [1, 0, 2], scale: 1.0 },
      { id: 'asset-5', assetId: 'barrel-01', position: [-1, 0, -2], scale: 1.0 },
      { id: 'asset-6', assetId: 'barrel-01', position: [3, 0, 1], scale: 0.8 },
    ],
    objects: [
      // Gold pile (multiple small spheres)
      { id: 'gold-1', type: 'sphere', name: 'Gold Pile', position: [0.5, 0.2, 0.5], rotation: [0, 0, 0], scale: [0.3, 0.2, 0.3], material: { color: '#ffd700', metalness: 1, roughness: 0.2, emissive: '#ffaa00', emissiveIntensity: 0.1 }, castShadow: true },
      { id: 'gold-2', type: 'sphere', name: 'Gold Pile', position: [-0.3, 0.15, 0.3], rotation: [0, 0, 0], scale: [0.25, 0.15, 0.25], material: { color: '#ffd700', metalness: 1, roughness: 0.2, emissive: '#ffaa00', emissiveIntensity: 0.1 }, castShadow: true },
      { id: 'gold-3', type: 'sphere', name: 'Gold Pile', position: [0.2, 0.1, -0.3], rotation: [0, 0, 0], scale: [0.2, 0.1, 0.2], material: { color: '#ffd700', metalness: 1, roughness: 0.2, emissive: '#ffaa00', emissiveIntensity: 0.1 }, castShadow: true },
    ],
    metadata: {
      estimatedPolygons: 12000,
      objectCount: 3,
      lightCount: 5,
      generatedAt: new Date().toISOString(),
      prompt: "Dragon's cave with treasure"
    }
  },

  // Sci-Fi scene - uses primitives for tech elements
  sciFi: {
    name: 'Sci-Fi Lab',
    description: 'A futuristic laboratory with glowing elements',
    background: {
      color: '#050515',
      fog: { color: '#050515', near: 10, far: 35 }
    },
    camera: {
      position: [6, 4, 6],
      target: [0, 1.5, 0],
      fov: 55
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#1a1a3a', intensity: 0.3 },
      { id: 'dir-1', type: 'directional', color: '#4444ff', intensity: 0.5, position: [5, 10, 5], castShadow: true },
      { id: 'point-1', type: 'point', color: '#00ffff', intensity: 1.0, position: [0, 3, 0], castShadow: false, distance: 10 },
      { id: 'point-2', type: 'point', color: '#ff00ff', intensity: 0.8, position: [-3, 2, 2], castShadow: false, distance: 8 }
    ],
    assets: [
      { id: 'asset-1', assetId: 'console-scifi-01', position: [-3, 0, -2], scale: 1.2 },
      { id: 'asset-2', assetId: 'crate-scifi-01', position: [3, 0, 2], scale: 1.0 },
      { id: 'asset-3', assetId: 'crate-scifi-01', position: [4, 0, 1], scale: 0.8 },
    ],
    objects: [
      { id: 'floor', type: 'box', name: 'Floor', position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [15, 0.1, 15], material: { color: '#0a0a1a', metalness: 0.9, roughness: 0.1 }, receiveShadow: true },
      { id: 'pod-base', type: 'cylinder', name: 'Pod Base', position: [0, 0.2, 0], rotation: [0, 0, 0], scale: [1.5, 0.4, 1.5], material: { color: '#1a1a2e', metalness: 0.8, roughness: 0.2 }, castShadow: true },
      { id: 'pod-tube', type: 'cylinder', name: 'Pod Tube', position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [1, 2, 1], material: { color: '#00ffff', metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.3 }, castShadow: false },
      { id: 'pod-ring-1', type: 'torus', name: 'Pod Ring', position: [0, 0.5, 0], rotation: [Math.PI / 2, 0, 0], scale: [1.1, 1.1, 0.1], material: { color: '#00ffff', metalness: 0.9, roughness: 0.1, emissive: '#00ffff', emissiveIntensity: 0.5 }, castShadow: true },
      { id: 'pod-ring-2', type: 'torus', name: 'Pod Ring', position: [0, 2.5, 0], rotation: [Math.PI / 2, 0, 0], scale: [1.1, 1.1, 0.1], material: { color: '#00ffff', metalness: 0.9, roughness: 0.1, emissive: '#00ffff', emissiveIntensity: 0.5 }, castShadow: true },
      { id: 'energy-1', type: 'sphere', name: 'Energy Orb', position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [0.4, 0.4, 0.4], material: { color: '#ffffff', emissive: '#00ffff', emissiveIntensity: 2 }, castShadow: false },
    ],
    metadata: {
      estimatedPolygons: 2500,
      objectCount: 6,
      lightCount: 4,
      generatedAt: new Date().toISOString(),
      prompt: 'Futuristic science lab'
    }
  },

  // Mountain scene - uses mountain terrain with pine trees
  mountain: {
    name: 'Alpine Peak',
    description: 'A rugged mountain peak with dramatic terrain and sparse vegetation',
    background: {
      color: '#1a2030',
      fog: { color: '#2a3040', near: 10, far: 35 }
    },
    camera: {
      position: [12, 8, 12],
      target: [0, 2, 0],
      fov: 50
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#6080a0', intensity: 0.5 },
      { id: 'dir-1', type: 'directional', color: '#ffffee', intensity: 1.5, position: [10, 15, 10], castShadow: true },
      { id: 'point-1', type: 'point', color: '#aaccff', intensity: 0.3, position: [0, 5, 0], castShadow: false }
    ],
    terrain: {
      width: 35,
      depth: 35,
      segments: 72,
      heightScale: 6,
      biome: 'mountains',
      seed: 999
    },
    vegetation: {
      trees: [
        { id: 'tree-1', type: 'pine', position: [-6, 0, -4], scale: 1.5, seed: 401 },
        { id: 'tree-2', type: 'pine', position: [5, 0, -6], scale: 1.3, seed: 402 },
        { id: 'tree-3', type: 'pine', position: [-8, 0, 2], scale: 1.7, seed: 403 },
        { id: 'tree-4', type: 'pine', position: [7, 0, 3], scale: 1.2, seed: 404 },
      ],
      rocks: [
        { id: 'rock-1', type: 'jagged', position: [-3, 0, -5], scale: 1.5, seed: 501 },
        { id: 'rock-2', type: 'boulder', position: [4, 0, -2], scale: 1.8, seed: 502 },
        { id: 'rock-3', type: 'jagged', position: [-5, 0, 4], scale: 2.0, seed: 503 },
        { id: 'rock-4', type: 'boulder', position: [2, 0, 5], scale: 1.4, seed: 504 },
        { id: 'rock-5', type: 'jagged', position: [0, 0, -7], scale: 2.5, seed: 505 },
      ],
      grass: {
        enabled: false
      }
    },
    assets: [],
    objects: [],
    metadata: {
      estimatedPolygons: 18000,
      objectCount: 0,
      lightCount: 3,
      generatedAt: new Date().toISOString(),
      prompt: 'Alpine mountain peak'
    }
  },

  // Desert scene - uses desert terrain with palm trees
  desert: {
    name: 'Desert Oasis',
    description: 'A serene desert oasis with palm trees and sandy terrain',
    background: {
      color: '#3a2a1a',
      fog: { color: '#5a4a3a', near: 12, far: 40 }
    },
    camera: {
      position: [10, 5, 10],
      target: [0, 0, 0],
      fov: 55
    },
    lights: [
      { id: 'ambient-1', type: 'ambient', color: '#ffd080', intensity: 0.5 },
      { id: 'dir-1', type: 'directional', color: '#ffdd88', intensity: 1.8, position: [10, 20, 5], castShadow: true },
      { id: 'point-1', type: 'point', color: '#88ccff', intensity: 0.4, position: [0, 1, 0], castShadow: false }
    ],
    terrain: {
      width: 30,
      depth: 30,
      segments: 56,
      heightScale: 1.5,
      biome: 'desert',
      seed: 777
    },
    vegetation: {
      trees: [
        { id: 'tree-1', type: 'palm', position: [-2, 0, -1], scale: 1.2, seed: 601 },
        { id: 'tree-2', type: 'palm', position: [1, 0, -2], scale: 1.0, seed: 602 },
        { id: 'tree-3', type: 'palm', position: [-1, 0, 2], scale: 1.4, seed: 603 },
        { id: 'tree-4', type: 'palm', position: [3, 0, 1], scale: 0.9, seed: 604 },
      ],
      rocks: [
        { id: 'rock-1', type: 'flat', position: [-5, 0, -3], scale: 1.2, seed: 701 },
        { id: 'rock-2', type: 'smooth', position: [4, 0, -4], scale: 0.8, seed: 702 },
        { id: 'rock-3', type: 'flat', position: [-4, 0, 4], scale: 1.5, seed: 703 },
        { id: 'rock-4', type: 'smooth', position: [5, 0, 2], scale: 1.0, seed: 704 },
      ],
      grass: {
        enabled: false
      }
    },
    assets: [
      { id: 'asset-1', assetId: 'barrel-01', position: [2, 0, -1], scale: 0.8 },
      { id: 'asset-2', assetId: 'crate-01', position: [-3, 0, 1], scale: 0.7 },
    ],
    objects: [
      // Water pool
      { id: 'water', type: 'cylinder', name: 'Oasis Pool', position: [0, -0.3, 0], rotation: [0, 0, 0], scale: [3, 0.1, 3], material: { color: '#2080a0', metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.8 }, receiveShadow: true },
    ],
    metadata: {
      estimatedPolygons: 10000,
      objectCount: 1,
      lightCount: 3,
      generatedAt: new Date().toISOString(),
      prompt: 'Desert oasis'
    }
  }
}

// Generate demo scene (fallback when bridge not available)
export function generateDemoScene(prompt: string): GeneratedScene {
  const lowerPrompt = prompt.toLowerCase()

  // Sci-Fi / Tech scenes
  if (lowerPrompt.includes('sci-fi') || lowerPrompt.includes('lab') || lowerPrompt.includes('future') || lowerPrompt.includes('cyber') || lowerPrompt.includes('space')) {
    return { ...EXAMPLE_SCENES.sciFi, metadata: { ...EXAMPLE_SCENES.sciFi.metadata, prompt, generatedAt: new Date().toISOString() } }
  }

  // Fantasy / Adventure scenes (dragon, cave, dungeon, treasure)
  if (lowerPrompt.includes('dragon') || lowerPrompt.includes('cave') || lowerPrompt.includes('dungeon') || lowerPrompt.includes('treasure') || lowerPrompt.includes('lair') || lowerPrompt.includes('volcanic') || lowerPrompt.includes('crystal')) {
    return { ...EXAMPLE_SCENES.dragonCave, metadata: { ...EXAMPLE_SCENES.dragonCave.metadata, prompt, generatedAt: new Date().toISOString() } }
  }

  // Mountain / Alpine scenes
  if (lowerPrompt.includes('mountain') || lowerPrompt.includes('alpine') || lowerPrompt.includes('peak') || lowerPrompt.includes('snowy') || lowerPrompt.includes('rugged')) {
    return { ...EXAMPLE_SCENES.mountain, metadata: { ...EXAMPLE_SCENES.mountain.metadata, prompt, generatedAt: new Date().toISOString() } }
  }

  // Desert / Oasis scenes
  if (lowerPrompt.includes('desert') || lowerPrompt.includes('oasis') || lowerPrompt.includes('sand') || lowerPrompt.includes('palm') || lowerPrompt.includes('arid')) {
    return { ...EXAMPLE_SCENES.desert, metadata: { ...EXAMPLE_SCENES.desert.metadata, prompt, generatedAt: new Date().toISOString() } }
  }

  // Nature / Outdoor scenes (forest, tree, nature, outdoor, garden)
  if (lowerPrompt.includes('forest') || lowerPrompt.includes('tree') || lowerPrompt.includes('nature') || lowerPrompt.includes('outdoor') || lowerPrompt.includes('garden') || lowerPrompt.includes('meadow') || lowerPrompt.includes('clearing') || lowerPrompt.includes('enchanted')) {
    return { ...EXAMPLE_SCENES.forest, metadata: { ...EXAMPLE_SCENES.forest.metadata, prompt, generatedAt: new Date().toISOString() } }
  }

  // Default to office for indoor/generic scenes
  return { ...EXAMPLE_SCENES.office, metadata: { ...EXAMPLE_SCENES.office.metadata, prompt, generatedAt: new Date().toISOString() } }
}
