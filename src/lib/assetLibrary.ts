/**
 * Asset Library Integration for EnvForge
 * Supports loading GLB/GLTF models from various free sources
 */

// Asset source configurations
export interface AssetSource {
  name: string
  baseUrl: string
  type: 'cdn' | 'api' | 'local'
  requiresAttribution: boolean
  license: string
}

export const ASSET_SOURCES: Record<string, AssetSource> = {
  kenney: {
    name: 'Kenney Assets',
    baseUrl: 'https://raw.githubusercontent.com/KenneyNL/Assets-Free/main',
    type: 'cdn',
    requiresAttribution: false,
    license: 'CC0'
  },
  polyhaven: {
    name: 'Poly Haven',
    baseUrl: 'https://dl.polyhaven.org',
    type: 'api',
    requiresAttribution: true,
    license: 'CC0'
  },
  sketchfab: {
    name: 'Sketchfab',
    baseUrl: 'https://sketchfab.com',
    type: 'api',
    requiresAttribution: true,
    license: 'Various'
  },
  local: {
    name: 'Local Assets',
    baseUrl: '/assets',
    type: 'local',
    requiresAttribution: false,
    license: 'N/A'
  }
}

// Asset categories and their available models
export interface AssetInfo {
  id: string
  name: string
  category: AssetCategory
  url: string
  source: keyof typeof ASSET_SOURCES
  thumbnail?: string
  tags: string[]
  scale?: number  // Default scale adjustment
  yOffset?: number  // Y position offset (for ground alignment)
}

export type AssetCategory =
  | 'vegetation'
  | 'rocks'
  | 'buildings'
  | 'furniture'
  | 'vehicles'
  | 'characters'
  | 'props'
  | 'nature'
  | 'sci-fi'
  | 'fantasy'

// Curated list of free GLB assets
// These URLs point to freely available assets from various sources
export const CURATED_ASSETS: AssetInfo[] = [
  // Vegetation
  {
    id: 'tree-oak-01',
    name: 'Oak Tree',
    category: 'vegetation',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/tree_oak.glb',
    source: 'kenney',
    tags: ['tree', 'nature', 'oak', 'forest'],
    scale: 1.5,
    yOffset: 0
  },
  {
    id: 'tree-pine-01',
    name: 'Pine Tree',
    category: 'vegetation',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/tree_pine.glb',
    source: 'kenney',
    tags: ['tree', 'nature', 'pine', 'forest', 'conifer'],
    scale: 1.2,
    yOffset: 0
  },
  {
    id: 'bush-01',
    name: 'Bush',
    category: 'vegetation',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/bush.glb',
    source: 'kenney',
    tags: ['bush', 'nature', 'shrub'],
    scale: 0.8,
    yOffset: 0
  },
  {
    id: 'flower-01',
    name: 'Flowers',
    category: 'vegetation',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/flowers.glb',
    source: 'kenney',
    tags: ['flower', 'nature', 'plant'],
    scale: 0.5,
    yOffset: 0
  },

  // Rocks
  {
    id: 'rock-large-01',
    name: 'Large Rock',
    category: 'rocks',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/rock_large.glb',
    source: 'kenney',
    tags: ['rock', 'nature', 'boulder'],
    scale: 1.0,
    yOffset: 0
  },
  {
    id: 'rock-small-01',
    name: 'Small Rock',
    category: 'rocks',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/rock_small.glb',
    source: 'kenney',
    tags: ['rock', 'nature', 'stone'],
    scale: 0.5,
    yOffset: 0
  },

  // Buildings
  {
    id: 'house-small-01',
    name: 'Small House',
    category: 'buildings',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Buildings/house_small.glb',
    source: 'kenney',
    tags: ['house', 'building', 'residential'],
    scale: 1.0,
    yOffset: 0
  },
  {
    id: 'tower-01',
    name: 'Tower',
    category: 'buildings',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Buildings/tower.glb',
    source: 'kenney',
    tags: ['tower', 'building', 'castle', 'medieval'],
    scale: 1.0,
    yOffset: 0
  },

  // Furniture
  {
    id: 'chair-01',
    name: 'Chair',
    category: 'furniture',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Furniture/chair.glb',
    source: 'kenney',
    tags: ['chair', 'furniture', 'seating'],
    scale: 0.4,
    yOffset: 0
  },
  {
    id: 'table-01',
    name: 'Table',
    category: 'furniture',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Furniture/table.glb',
    source: 'kenney',
    tags: ['table', 'furniture'],
    scale: 0.5,
    yOffset: 0
  },
  {
    id: 'desk-01',
    name: 'Desk',
    category: 'furniture',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Furniture/desk.glb',
    source: 'kenney',
    tags: ['desk', 'furniture', 'office'],
    scale: 0.5,
    yOffset: 0
  },

  // Props
  {
    id: 'barrel-01',
    name: 'Barrel',
    category: 'props',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Props/barrel.glb',
    source: 'kenney',
    tags: ['barrel', 'container', 'storage'],
    scale: 0.4,
    yOffset: 0
  },
  {
    id: 'crate-01',
    name: 'Crate',
    category: 'props',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Props/crate.glb',
    source: 'kenney',
    tags: ['crate', 'container', 'box', 'storage'],
    scale: 0.3,
    yOffset: 0
  },
  {
    id: 'chest-01',
    name: 'Treasure Chest',
    category: 'props',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Props/chest.glb',
    source: 'kenney',
    tags: ['chest', 'treasure', 'container', 'fantasy'],
    scale: 0.4,
    yOffset: 0
  },
  {
    id: 'lamp-post-01',
    name: 'Lamp Post',
    category: 'props',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Props/lamp_post.glb',
    source: 'kenney',
    tags: ['lamp', 'light', 'street', 'post'],
    scale: 0.8,
    yOffset: 0
  },

  // Fantasy
  {
    id: 'crystal-01',
    name: 'Crystal',
    category: 'fantasy',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Fantasy/crystal.glb',
    source: 'kenney',
    tags: ['crystal', 'magic', 'fantasy', 'gem'],
    scale: 0.5,
    yOffset: 0
  },
  {
    id: 'mushroom-01',
    name: 'Giant Mushroom',
    category: 'fantasy',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Nature/mushroom_large.glb',
    source: 'kenney',
    tags: ['mushroom', 'nature', 'fantasy', 'fungus'],
    scale: 0.8,
    yOffset: 0
  },

  // Sci-Fi
  {
    id: 'console-scifi-01',
    name: 'Sci-Fi Console',
    category: 'sci-fi',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/SciFi/console.glb',
    source: 'kenney',
    tags: ['console', 'computer', 'sci-fi', 'tech'],
    scale: 0.5,
    yOffset: 0
  },
  {
    id: 'crate-scifi-01',
    name: 'Sci-Fi Crate',
    category: 'sci-fi',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/SciFi/crate.glb',
    source: 'kenney',
    tags: ['crate', 'container', 'sci-fi', 'cargo'],
    scale: 0.4,
    yOffset: 0
  },

  // Vehicles
  {
    id: 'car-01',
    name: 'Car',
    category: 'vehicles',
    url: 'https://raw.githubusercontent.com/KenneyNL/Assets/main/Vehicles/car.glb',
    source: 'kenney',
    tags: ['car', 'vehicle', 'automobile'],
    scale: 0.8,
    yOffset: 0
  }
]

// Asset search and filtering
export function searchAssets(query: string): AssetInfo[] {
  const lowerQuery = query.toLowerCase()
  return CURATED_ASSETS.filter(asset =>
    asset.name.toLowerCase().includes(lowerQuery) ||
    asset.tags.some(tag => tag.includes(lowerQuery)) ||
    asset.category.includes(lowerQuery)
  )
}

export function getAssetsByCategory(category: AssetCategory): AssetInfo[] {
  return CURATED_ASSETS.filter(asset => asset.category === category)
}

export function getAssetById(id: string): AssetInfo | undefined {
  return CURATED_ASSETS.find(asset => asset.id === id)
}

export function getAssetsByTags(tags: string[]): AssetInfo[] {
  const lowerTags = tags.map(t => t.toLowerCase())
  return CURATED_ASSETS.filter(asset =>
    lowerTags.some(tag => asset.tags.includes(tag))
  )
}

// Smart asset suggestion based on scene description
export function suggestAssetsForScene(description: string): AssetInfo[] {
  const lowerDesc = description.toLowerCase()
  const suggestions: AssetInfo[] = []
  const seenIds = new Set<string>()

  // Keyword to asset mapping
  const keywordMappings: Record<string, string[]> = {
    // Nature/Outdoor
    'forest': ['tree-oak-01', 'tree-pine-01', 'bush-01', 'rock-large-01', 'mushroom-01'],
    'tree': ['tree-oak-01', 'tree-pine-01'],
    'garden': ['bush-01', 'flower-01', 'rock-small-01'],
    'park': ['tree-oak-01', 'bush-01', 'flower-01', 'lamp-post-01'],
    'nature': ['tree-oak-01', 'tree-pine-01', 'bush-01', 'rock-large-01', 'flower-01'],
    'mountain': ['rock-large-01', 'rock-small-01', 'tree-pine-01'],
    'cave': ['rock-large-01', 'rock-small-01', 'crystal-01', 'chest-01'],
    'dragon': ['rock-large-01', 'crystal-01', 'chest-01', 'barrel-01'],

    // Fantasy
    'fantasy': ['crystal-01', 'mushroom-01', 'chest-01', 'tower-01'],
    'magic': ['crystal-01', 'mushroom-01', 'chest-01'],
    'medieval': ['tower-01', 'barrel-01', 'chest-01', 'crate-01'],
    'dungeon': ['barrel-01', 'chest-01', 'crate-01', 'rock-large-01'],
    'castle': ['tower-01', 'barrel-01', 'chest-01'],
    'treasure': ['chest-01', 'crystal-01', 'barrel-01'],

    // Sci-Fi
    'sci-fi': ['console-scifi-01', 'crate-scifi-01'],
    'space': ['console-scifi-01', 'crate-scifi-01'],
    'lab': ['console-scifi-01', 'crate-scifi-01', 'table-01'],
    'future': ['console-scifi-01', 'crate-scifi-01'],
    'cyber': ['console-scifi-01', 'crate-scifi-01'],

    // Interior
    'office': ['desk-01', 'chair-01', 'table-01', 'lamp-post-01'],
    'room': ['chair-01', 'table-01', 'desk-01'],
    'house': ['house-small-01', 'chair-01', 'table-01'],
    'furniture': ['chair-01', 'table-01', 'desk-01'],
    'living': ['chair-01', 'table-01'],

    // Urban
    'street': ['lamp-post-01', 'car-01', 'crate-01'],
    'city': ['house-small-01', 'lamp-post-01', 'car-01'],
    'urban': ['lamp-post-01', 'car-01', 'barrel-01'],

    // Storage/Industrial
    'warehouse': ['crate-01', 'barrel-01', 'crate-scifi-01'],
    'storage': ['crate-01', 'barrel-01', 'chest-01'],
  }

  // Find matching keywords and add suggested assets
  for (const [keyword, assetIds] of Object.entries(keywordMappings)) {
    if (lowerDesc.includes(keyword)) {
      for (const assetId of assetIds) {
        if (!seenIds.has(assetId)) {
          const asset = getAssetById(assetId)
          if (asset) {
            suggestions.push(asset)
            seenIds.add(assetId)
          }
        }
      }
    }
  }

  // If no specific matches, return general nature assets
  if (suggestions.length === 0) {
    return CURATED_ASSETS.filter(a =>
      a.category === 'vegetation' || a.category === 'rocks'
    ).slice(0, 5)
  }

  return suggestions.slice(0, 10)  // Limit to 10 suggestions
}

// Asset loading helper (for use with Three.js GLTFLoader)
export interface AssetLoadOptions {
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
}

export function getAssetUrl(assetInfo: AssetInfo): string {
  // Handle different source types
  switch (assetInfo.source) {
    case 'local':
      return `${ASSET_SOURCES.local.baseUrl}/${assetInfo.id}.glb`
    default:
      return assetInfo.url
  }
}

// Cache for loaded assets
const assetCache = new Map<string, unknown>()

export function getCachedAsset(id: string): unknown | undefined {
  return assetCache.get(id)
}

export function setCachedAsset(id: string, asset: unknown): void {
  assetCache.set(id, asset)
}

export function clearAssetCache(): void {
  assetCache.clear()
}

// Asset attribution helper
export function getAssetAttribution(assetInfo: AssetInfo): string | null {
  const source = ASSET_SOURCES[assetInfo.source]
  if (!source.requiresAttribution) return null
  return `"${assetInfo.name}" from ${source.name} (${source.license})`
}

export function getAllAttributions(assets: AssetInfo[]): string[] {
  return assets
    .map(getAssetAttribution)
    .filter((attr): attr is string => attr !== null)
}
