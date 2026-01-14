/**
 * Procedural Vegetation Generation for EnvForge
 * Includes L-System trees, procedural rocks, grass, and foliage
 */

import { SimplexNoise } from './proceduralTerrain'

// =============================================================================
// L-System Tree Generation
// =============================================================================

interface LSystemRule {
  symbol: string
  replacement: string
  probability?: number
}

interface LSystemConfig {
  axiom: string
  rules: LSystemRule[]
  iterations: number
  angle: number
  lengthFactor: number
  lengthDecay: number
  widthFactor: number
  widthDecay: number
}

interface TreeBranch {
  start: [number, number, number]
  end: [number, number, number]
  width: number
  depth: number
}

interface TreeFoliage {
  position: [number, number, number]
  scale: number
  color: [number, number, number]
}

export interface GeneratedTree {
  branches: TreeBranch[]
  foliage: TreeFoliage[]
  boundingBox: { min: [number, number, number], max: [number, number, number] }
  trunkColor: string
  foliageColor: string
}

// Tree presets using L-Systems
const TREE_PRESETS: Record<string, LSystemConfig> = {
  oak: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: 'FF+[+F-F-F]-[-F+F+F]' }
    ],
    iterations: 3,
    angle: 25,
    lengthFactor: 1.0,
    lengthDecay: 0.7,
    widthFactor: 0.15,
    widthDecay: 0.7
  },
  pine: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: 'F[+F]F[-F][F]' }
    ],
    iterations: 4,
    angle: 30,
    lengthFactor: 0.8,
    lengthDecay: 0.65,
    widthFactor: 0.1,
    widthDecay: 0.75
  },
  willow: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: 'F[-F][+F]F[-F]' }
    ],
    iterations: 4,
    angle: 35,
    lengthFactor: 0.9,
    lengthDecay: 0.75,
    widthFactor: 0.08,
    widthDecay: 0.8
  },
  bush: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: '[+F][-F]F' }
    ],
    iterations: 4,
    angle: 45,
    lengthFactor: 0.5,
    lengthDecay: 0.6,
    widthFactor: 0.05,
    widthDecay: 0.7
  },
  palm: {
    axiom: 'FFFFF[+++F][---F][++F][--F]',
    rules: [
      { symbol: 'F', replacement: 'FF' }
    ],
    iterations: 2,
    angle: 35,
    lengthFactor: 0.6,
    lengthDecay: 0.8,
    widthFactor: 0.12,
    widthDecay: 0.9
  }
}

function expandLSystem(config: LSystemConfig, randomSeed: number = 0): string {
  let current = config.axiom
  const noise = new SimplexNoise(randomSeed)

  for (let i = 0; i < config.iterations; i++) {
    let next = ''
    for (const char of current) {
      let replaced = false
      for (const rule of config.rules) {
        if (char === rule.symbol) {
          const prob = rule.probability ?? 1.0
          if (noise.noise2D(i, next.length) + 1 < prob * 2) {
            next += rule.replacement
            replaced = true
            break
          }
        }
      }
      if (!replaced) {
        next += char
      }
    }
    current = next
  }
  return current
}

export function generateTree(
  type: keyof typeof TREE_PRESETS = 'oak',
  scale: number = 1,
  seed: number = Date.now()
): GeneratedTree {
  const config = TREE_PRESETS[type] || TREE_PRESETS.oak
  const lstring = expandLSystem(config, seed)

  const branches: TreeBranch[] = []
  const foliage: TreeFoliage[] = []
  const stack: Array<{
    pos: [number, number, number]
    dir: [number, number, number]
    length: number
    width: number
    depth: number
  }> = []

  let pos: [number, number, number] = [0, 0, 0]
  let dir: [number, number, number] = [0, 1, 0]
  let length = config.lengthFactor * scale
  let width = config.widthFactor * scale
  let depth = 0

  const angleRad = (config.angle * Math.PI) / 180
  const noise = new SimplexNoise(seed)

  let minBounds: [number, number, number] = [Infinity, Infinity, Infinity]
  let maxBounds: [number, number, number] = [-Infinity, -Infinity, -Infinity]

  function updateBounds(p: [number, number, number]) {
    minBounds = [Math.min(minBounds[0], p[0]), Math.min(minBounds[1], p[1]), Math.min(minBounds[2], p[2])]
    maxBounds = [Math.max(maxBounds[0], p[0]), Math.max(maxBounds[1], p[1]), Math.max(maxBounds[2], p[2])]
  }

  function rotateY(v: [number, number, number], angle: number): [number, number, number] {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos]
  }

  function rotateZ(v: [number, number, number], angle: number): [number, number, number] {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos, v[2]]
  }

  for (let i = 0; i < lstring.length; i++) {
    const char = lstring[i]
    const variation = noise.noise2D(i * 0.1, seed) * 0.2

    switch (char) {
      case 'F': {
        const start: [number, number, number] = [...pos]
        const end: [number, number, number] = [
          pos[0] + dir[0] * length * (1 + variation),
          pos[1] + dir[1] * length * (1 + variation),
          pos[2] + dir[2] * length * (1 + variation)
        ]

        branches.push({ start, end, width, depth })
        updateBounds(start)
        updateBounds(end)

        // Add foliage at branch tips (after certain depth)
        if (depth >= config.iterations - 1) {
          foliage.push({
            position: end,
            scale: 0.3 * scale * (1 + variation * 0.5),
            color: [0.2 + variation * 0.1, 0.5 + variation * 0.15, 0.2 + variation * 0.1]
          })
        }

        pos = end
        length *= config.lengthDecay
        width *= config.widthDecay
        depth++
        break
      }
      case '+': {
        const angle = angleRad * (1 + variation)
        dir = rotateZ(dir, angle)
        dir = rotateY(dir, variation * angleRad)
        break
      }
      case '-': {
        const angle = -angleRad * (1 + variation)
        dir = rotateZ(dir, angle)
        dir = rotateY(dir, variation * angleRad)
        break
      }
      case '[': {
        stack.push({ pos: [...pos], dir: [...dir], length, width, depth })
        break
      }
      case ']': {
        const state = stack.pop()
        if (state) {
          pos = state.pos
          dir = state.dir
          length = state.length
          width = state.width
          depth = state.depth
        }
        break
      }
    }
  }

  // Tree colors based on type
  const treeColors: Record<string, { trunk: string, foliage: string }> = {
    oak: { trunk: '#5D4E37', foliage: '#2D5A27' },
    pine: { trunk: '#4A3728', foliage: '#1B4332' },
    willow: { trunk: '#6B5344', foliage: '#3A5F0B' },
    bush: { trunk: '#4A3728', foliage: '#228B22' },
    palm: { trunk: '#8B7355', foliage: '#228B22' }
  }

  return {
    branches,
    foliage,
    boundingBox: { min: minBounds, max: maxBounds },
    trunkColor: treeColors[type]?.trunk || '#5D4E37',
    foliageColor: treeColors[type]?.foliage || '#2D5A27'
  }
}

// =============================================================================
// Procedural Rock Generation
// =============================================================================

export interface GeneratedRock {
  vertices: number[]
  indices: number[]
  normals: number[]
  color: string
  roughness: number
  metalness: number
}

export function generateRock(
  scale: number = 1,
  seed: number = Date.now(),
  type: 'boulder' | 'jagged' | 'smooth' | 'flat' = 'boulder'
): GeneratedRock {
  const noise = new SimplexNoise(seed)
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []

  // Generate icosphere base
  const t = (1 + Math.sqrt(5)) / 2
  const baseVertices: [number, number, number][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ]

  const baseIndices = [
    0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
    1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
    4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
  ]

  // Deform based on rock type
  const deformationStrength = {
    boulder: 0.3,
    jagged: 0.5,
    smooth: 0.15,
    flat: 0.2
  }[type]

  for (const [x, y, z] of baseVertices) {
    // Normalize
    const len = Math.sqrt(x * x + y * y + z * z)
    let nx = x / len
    let ny = y / len
    let nz = z / len

    // Apply noise deformation
    const noiseVal = noise.fbm(nx * 2, ny * 2, 3) * deformationStrength

    // Type-specific deformation
    let deformedY = ny
    if (type === 'flat') {
      deformedY *= 0.4 // Flatten vertically
    } else if (type === 'jagged') {
      const spike = Math.abs(noise.noise2D(nx * 5, nz * 5))
      nx += spike * 0.2 * Math.sign(nx)
      nz += spike * 0.2 * Math.sign(nz)
    }

    const finalScale = scale * (1 + noiseVal)
    vertices.push(nx * finalScale, deformedY * finalScale, nz * finalScale)
  }

  indices.push(...baseIndices)

  // Calculate normals
  const vertexNormals: [number, number, number][] = baseVertices.map(() => [0, 0, 0])

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2]
    const v0 = [vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]]
    const v1 = [vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]]
    const v2 = [vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]]

    const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]]
    const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]]

    const n: [number, number, number] = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0]
    ]

    for (const idx of [i0, i1, i2]) {
      vertexNormals[idx][0] += n[0]
      vertexNormals[idx][1] += n[1]
      vertexNormals[idx][2] += n[2]
    }
  }

  for (const n of vertexNormals) {
    const len = Math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2)
    normals.push(n[0] / len, n[1] / len, n[2] / len)
  }

  // Rock colors based on type
  const rockColors: Record<string, { color: string, roughness: number, metalness: number }> = {
    boulder: { color: '#6B6B6B', roughness: 0.9, metalness: 0.1 },
    jagged: { color: '#4A4A4A', roughness: 0.95, metalness: 0.05 },
    smooth: { color: '#7A7A7A', roughness: 0.6, metalness: 0.2 },
    flat: { color: '#5A5A5A', roughness: 0.85, metalness: 0.1 }
  }

  return {
    vertices,
    indices,
    normals,
    ...rockColors[type]
  }
}

// =============================================================================
// Grass/Foliage Placement
// =============================================================================

export interface GrassBlade {
  position: [number, number, number]
  rotation: number
  scale: number
  color: [number, number, number]
}

export interface GrassCluster {
  blades: GrassBlade[]
  bounds: { min: [number, number, number], max: [number, number, number] }
}

export function generateGrassCluster(
  centerX: number,
  centerZ: number,
  radius: number,
  density: number,
  getHeight: (x: number, z: number) => number,
  seed: number = Date.now()
): GrassCluster {
  const noise = new SimplexNoise(seed)
  const blades: GrassBlade[] = []

  const count = Math.floor(radius * radius * density)
  let minY = Infinity, maxY = -Infinity

  for (let i = 0; i < count; i++) {
    const angle = noise.noise2D(i * 0.1, seed) * Math.PI * 2
    const dist = Math.sqrt(noise.noise2D(i * 0.2, seed * 2) + 1) * radius * 0.5

    const x = centerX + Math.cos(angle) * dist
    const z = centerZ + Math.sin(angle) * dist
    const y = getHeight(x, z)

    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)

    const rotation = noise.noise2D(x * 0.5, z * 0.5) * Math.PI
    const scale = 0.1 + (noise.noise2D(x, z) + 1) * 0.15

    // Grass color variation
    const colorVar = noise.noise2D(x * 2, z * 2) * 0.1
    const color: [number, number, number] = [
      0.2 + colorVar,
      0.5 + colorVar * 2,
      0.1 + colorVar
    ]

    blades.push({ position: [x, y, z], rotation, scale, color })
  }

  return {
    blades,
    bounds: {
      min: [centerX - radius, minY, centerZ - radius],
      max: [centerX + radius, maxY + 0.3, centerZ + radius]
    }
  }
}

// =============================================================================
// Vegetation Placement System
// =============================================================================

export interface VegetationPlacement {
  type: 'tree' | 'rock' | 'grass' | 'flower'
  treeType?: keyof typeof TREE_PRESETS
  rockType?: 'boulder' | 'jagged' | 'smooth' | 'flat'
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  seed: number
}

export function generateVegetationPlacements(
  width: number,
  depth: number,
  getHeight: (x: number, z: number) => number,
  config: {
    treeDensity?: number      // Trees per unit area
    rockDensity?: number      // Rocks per unit area
    grassCoverage?: number    // 0-1 grass coverage
    biome?: 'forest' | 'plains' | 'desert' | 'tundra' | 'tropical'
  },
  seed: number = Date.now()
): VegetationPlacement[] {
  const noise = new SimplexNoise(seed)
  const placements: VegetationPlacement[] = []

  const {
    treeDensity = 0.05,
    rockDensity = 0.02,
    grassCoverage = 0.3,
    biome = 'forest'
  } = config

  const halfWidth = width / 2
  const halfDepth = depth / 2

  // Biome-specific tree types
  const biomeTreeTypes: Record<string, (keyof typeof TREE_PRESETS)[]> = {
    forest: ['oak', 'pine', 'bush'],
    plains: ['oak', 'bush'],
    desert: ['palm'],
    tundra: ['pine'],
    tropical: ['palm', 'bush']
  }

  const treeTypes = biomeTreeTypes[biome] || biomeTreeTypes.forest

  // Place trees using Poisson disk-like distribution
  const treeCount = Math.floor(width * depth * treeDensity)
  for (let i = 0; i < treeCount; i++) {
    const x = (noise.noise2D(i * 0.1, seed) * 0.5 + 0.5) * width - halfWidth
    const z = (noise.noise2D(seed, i * 0.1) * 0.5 + 0.5) * depth - halfDepth
    const y = getHeight(x, z)

    // Avoid placing on steep slopes
    const slopeTest = Math.abs(getHeight(x + 0.5, z) - y) + Math.abs(getHeight(x, z + 0.5) - y)
    if (slopeTest > 1) continue

    const treeType = treeTypes[Math.floor((noise.noise2D(x, z) + 1) * 0.5 * treeTypes.length)]
    const scale = 0.8 + (noise.noise2D(x * 0.5, z * 0.5) + 1) * 0.4
    const rotationY = noise.noise2D(z, x) * Math.PI * 2

    placements.push({
      type: 'tree',
      treeType,
      position: [x, y, z],
      rotation: [0, rotationY, 0],
      scale,
      seed: Math.floor((noise.noise2D(x, z) + 1) * 100000)
    })
  }

  // Place rocks
  const rockCount = Math.floor(width * depth * rockDensity)
  const rockTypes: ('boulder' | 'jagged' | 'smooth' | 'flat')[] = ['boulder', 'jagged', 'smooth', 'flat']

  for (let i = 0; i < rockCount; i++) {
    const x = (noise.noise2D(i * 0.15, seed + 1000) * 0.5 + 0.5) * width - halfWidth
    const z = (noise.noise2D(seed + 1000, i * 0.15) * 0.5 + 0.5) * depth - halfDepth
    const y = getHeight(x, z)

    const rockType = rockTypes[Math.floor((noise.noise2D(x * 2, z * 2) + 1) * 0.5 * rockTypes.length)]
    const scale = 0.3 + (noise.noise2D(x, z) + 1) * 0.5
    const rotationY = noise.noise2D(z * 2, x * 2) * Math.PI * 2

    placements.push({
      type: 'rock',
      rockType,
      position: [x, y, z],
      rotation: [0, rotationY, 0],
      scale,
      seed: Math.floor((noise.noise2D(x + 100, z + 100) + 1) * 100000)
    })
  }

  // Place grass clusters
  if (grassCoverage > 0 && biome !== 'desert') {
    const grassCount = Math.floor(width * depth * grassCoverage * 0.1)
    for (let i = 0; i < grassCount; i++) {
      const x = (noise.noise2D(i * 0.2, seed + 2000) * 0.5 + 0.5) * width - halfWidth
      const z = (noise.noise2D(seed + 2000, i * 0.2) * 0.5 + 0.5) * depth - halfDepth
      const y = getHeight(x, z)

      placements.push({
        type: 'grass',
        position: [x, y, z],
        rotation: [0, 0, 0],
        scale: 1 + (noise.noise2D(x * 0.3, z * 0.3) + 1) * 0.5,
        seed: Math.floor((noise.noise2D(x + 200, z + 200) + 1) * 100000)
      })
    }
  }

  return placements
}

// Export tree presets for external use
export const TREE_TYPES = Object.keys(TREE_PRESETS) as (keyof typeof TREE_PRESETS)[]
