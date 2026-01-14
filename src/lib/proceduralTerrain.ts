/**
 * Procedural Terrain Generation for EnvForge
 * Uses Perlin-like noise functions for realistic terrain
 */

// Simple noise implementation (seeded pseudo-random)
class SimplexNoise {
  private perm: number[] = []
  private grad3: number[][] = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ]

  constructor(seed: number = Math.random() * 65536) {
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i

    // Shuffle based on seed
    let n = seed
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647
      const j = n % (i + 1)
      ;[p[i], p[j]] = [p[j], p[i]]
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y
  }

  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6

    const s = (x + y) * F2
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)

    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = x - X0
    const y0 = y - Y0

    let i1: number, j1: number
    if (x0 > y0) { i1 = 1; j1 = 0 }
    else { i1 = 0; j1 = 1 }

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2

    const ii = i & 255
    const jj = j & 255

    const gi0 = this.perm[ii + this.perm[jj]] % 12
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12

    let n0 = 0, n1 = 0, n2 = 0

    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 >= 0) {
      t0 *= t0
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0)
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 >= 0) {
      t1 *= t1
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1)
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 >= 0) {
      t2 *= t2
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2)
    }

    return 70 * (n0 + n1 + n2)
  }

  // Fractal Brownian Motion for more natural terrain
  fbm(x: number, y: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency)
      maxValue += amplitude
      amplitude *= gain
      frequency *= lacunarity
    }

    return value / maxValue
  }
}

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

export interface TerrainVertex {
  position: [number, number, number]
  normal: [number, number, number]
  uv: [number, number]
  color: [number, number, number]
}

export interface GeneratedTerrain {
  vertices: number[]
  indices: number[]
  normals: number[]
  uvs: number[]
  colors: number[]
  heightMap: number[][]
  config: TerrainConfig
}

// Biome color palettes
const BIOME_COLORS: Record<string, { low: [number, number, number], mid: [number, number, number], high: [number, number, number] }> = {
  plains: {
    low: [0.2, 0.5, 0.2],   // Dark green (valleys)
    mid: [0.4, 0.6, 0.3],   // Green (flat areas)
    high: [0.5, 0.7, 0.4]   // Light green (hills)
  },
  mountains: {
    low: [0.3, 0.4, 0.3],   // Dark green (base)
    mid: [0.5, 0.5, 0.5],   // Gray (rock)
    high: [0.9, 0.95, 1.0]  // White (snow)
  },
  desert: {
    low: [0.8, 0.6, 0.4],   // Dark sand
    mid: [0.9, 0.8, 0.6],   // Sand
    high: [1.0, 0.9, 0.7]   // Light sand
  },
  forest: {
    low: [0.1, 0.3, 0.1],   // Dark forest floor
    mid: [0.2, 0.4, 0.15],  // Forest green
    high: [0.3, 0.5, 0.2]   // Lighter canopy
  },
  volcanic: {
    low: [0.1, 0.1, 0.1],   // Dark rock
    mid: [0.3, 0.2, 0.15],  // Brown rock
    high: [1.0, 0.3, 0.1]   // Lava glow
  }
}

export function generateTerrain(config: TerrainConfig): GeneratedTerrain {
  const {
    width,
    depth,
    segments,
    heightScale,
    seed = Date.now(),
    octaves = 4,
    lacunarity = 2,
    gain = 0.5,
    biome = 'plains'
  } = config

  const noise = new SimplexNoise(seed)
  const biomeColors = BIOME_COLORS[biome] || BIOME_COLORS.plains

  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const heightMap: number[][] = []

  const segmentWidth = width / segments
  const segmentDepth = depth / segments

  // Generate height map
  for (let z = 0; z <= segments; z++) {
    heightMap[z] = []
    for (let x = 0; x <= segments; x++) {
      const nx = x / segments
      const nz = z / segments

      // Multi-scale noise
      let height = noise.fbm(nx * 3, nz * 3, octaves, lacunarity, gain)

      // Apply biome-specific modifications
      if (biome === 'mountains') {
        height = Math.pow(Math.abs(height), 1.5) * Math.sign(height)
      } else if (biome === 'desert') {
        height = height * 0.3 + Math.abs(noise.noise2D(nx * 10, nz * 10)) * 0.1
      } else if (biome === 'volcanic') {
        const crater = 1 - Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(nz - 0.5, 2)) * 2
        height = height * 0.5 + Math.max(0, crater) * 1.5
      }

      heightMap[z][x] = height * heightScale
    }
  }

  // Generate vertices with colors
  for (let z = 0; z <= segments; z++) {
    for (let x = 0; x <= segments; x++) {
      const px = (x / segments - 0.5) * width
      const pz = (z / segments - 0.5) * depth
      const py = heightMap[z][x]

      vertices.push(px, py, pz)

      // UV coordinates
      uvs.push(x / segments, z / segments)

      // Height-based coloring
      const normalizedHeight = (py / heightScale + 1) / 2
      let r, g, b
      if (normalizedHeight < 0.4) {
        const t = normalizedHeight / 0.4
        r = biomeColors.low[0] + (biomeColors.mid[0] - biomeColors.low[0]) * t
        g = biomeColors.low[1] + (biomeColors.mid[1] - biomeColors.low[1]) * t
        b = biomeColors.low[2] + (biomeColors.mid[2] - biomeColors.low[2]) * t
      } else {
        const t = (normalizedHeight - 0.4) / 0.6
        r = biomeColors.mid[0] + (biomeColors.high[0] - biomeColors.mid[0]) * t
        g = biomeColors.mid[1] + (biomeColors.high[1] - biomeColors.mid[1]) * t
        b = biomeColors.mid[2] + (biomeColors.high[2] - biomeColors.mid[2]) * t
      }
      colors.push(r, g, b)
    }
  }

  // Generate indices
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const a = z * (segments + 1) + x
      const b = a + 1
      const c = a + segments + 1
      const d = c + 1

      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  // Calculate normals
  const vertexNormals: [number, number, number][] = new Array(vertices.length / 3).fill(null).map(() => [0, 0, 0])

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i]
    const i1 = indices[i + 1]
    const i2 = indices[i + 2]

    const v0 = [vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]]
    const v1 = [vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]]
    const v2 = [vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]]

    const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]]
    const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]]

    const normal: [number, number, number] = [
      edge1[1] * edge2[2] - edge1[2] * edge2[1],
      edge1[2] * edge2[0] - edge1[0] * edge2[2],
      edge1[0] * edge2[1] - edge1[1] * edge2[0]
    ]

    for (const idx of [i0, i1, i2]) {
      vertexNormals[idx][0] += normal[0]
      vertexNormals[idx][1] += normal[1]
      vertexNormals[idx][2] += normal[2]
    }
  }

  // Normalize normals
  for (const normal of vertexNormals) {
    const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2)
    if (len > 0) {
      normals.push(normal[0] / len, normal[1] / len, normal[2] / len)
    } else {
      normals.push(0, 1, 0)
    }
  }

  return {
    vertices,
    indices,
    normals,
    uvs,
    colors,
    heightMap,
    config
  }
}

// Get height at a specific world position (for placing objects)
export function getHeightAtPosition(terrain: GeneratedTerrain, x: number, z: number): number {
  const { width, depth, segments } = terrain.config

  // Convert world coords to terrain coords
  const tx = ((x / width) + 0.5) * segments
  const tz = ((z / depth) + 0.5) * segments

  // Clamp to terrain bounds
  const ix = Math.max(0, Math.min(segments, Math.floor(tx)))
  const iz = Math.max(0, Math.min(segments, Math.floor(tz)))

  // Bilinear interpolation
  const fx = tx - ix
  const fz = tz - iz

  const h00 = terrain.heightMap[iz]?.[ix] ?? 0
  const h10 = terrain.heightMap[iz]?.[ix + 1] ?? h00
  const h01 = terrain.heightMap[iz + 1]?.[ix] ?? h00
  const h11 = terrain.heightMap[iz + 1]?.[ix + 1] ?? h00

  const h0 = h00 + (h10 - h00) * fx
  const h1 = h01 + (h11 - h01) * fx

  return h0 + (h1 - h0) * fz
}

// Export noise for other procedural systems
export { SimplexNoise }
