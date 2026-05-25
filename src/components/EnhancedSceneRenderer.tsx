/**
 * Enhanced Scene Renderer for EnvForge
 * Supports procedural terrain, vegetation, rocks, and GLB model loading
 */

import { useMemo, useRef, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import type { GeneratedScene, GeneratedObject, GeneratedLight } from '../types/procedural'
import { generateTerrain, type GeneratedTerrain, type TerrainConfig } from '../lib/proceduralTerrain'
import { generateTree, generateRock, type GeneratedTree, type GeneratedRock, TREE_TYPES } from '../lib/proceduralVegetation'
import { getAssetById, getAssetUrl, type AssetInfo } from '../lib/assetLibrary'

// =============================================================================
// Extended Scene Types
// =============================================================================

export interface EnhancedGeneratedScene extends GeneratedScene {
  terrain?: TerrainConfig
  vegetation?: VegetationConfig
  assets?: AssetPlacement[]
}

export interface VegetationConfig {
  trees?: TreePlacement[]
  rocks?: RockPlacement[]
  grass?: GrassConfig
}

export interface TreePlacement {
  id: string
  type: keyof typeof TREE_TYPES | string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}

export interface RockPlacement {
  id: string
  type: 'boulder' | 'jagged' | 'smooth' | 'flat'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}

export interface GrassConfig {
  enabled: boolean
  density?: number
  color?: string
}

export interface AssetPlacement {
  id: string
  assetId: string  // Reference to asset library
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

// =============================================================================
// Terrain Renderer
// =============================================================================

function TerrainMesh({ config }: { config: TerrainConfig }) {
  const terrain = useMemo(() => generateTerrain(config), [config])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(terrain.vertices, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(terrain.normals, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(terrain.uvs, 2))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(terrain.colors, 3))
    geo.setIndex(terrain.indices)
    return geo
  }, [terrain])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.9}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// =============================================================================
// Tree Renderer (L-System)
// =============================================================================

function TreeMesh({
  type,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  seed
}: {
  type: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}) {
  const tree = useMemo(() => {
    const validType = TREE_TYPES.includes(type as any) ? type as keyof typeof TREE_TYPES : 'oak'
    return generateTree(validType, scale, seed || Date.now())
  }, [type, scale, seed])

  return (
    <group position={position} rotation={rotation}>
      {/* Trunk and branches */}
      {tree.branches.map((branch, i) => {
        const length = Math.sqrt(
          Math.pow(branch.end[0] - branch.start[0], 2) +
          Math.pow(branch.end[1] - branch.start[1], 2) +
          Math.pow(branch.end[2] - branch.start[2], 2)
        )

        if (length < 0.01) return null

        const midpoint: [number, number, number] = [
          (branch.start[0] + branch.end[0]) / 2,
          (branch.start[1] + branch.end[1]) / 2,
          (branch.start[2] + branch.end[2]) / 2
        ]

        // Calculate rotation to align with branch direction
        const direction = new THREE.Vector3(
          branch.end[0] - branch.start[0],
          branch.end[1] - branch.start[1],
          branch.end[2] - branch.start[2]
        ).normalize()

        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
        const euler = new THREE.Euler().setFromQuaternion(quaternion)

        return (
          <mesh
            key={`branch-${i}`}
            position={midpoint}
            rotation={[euler.x, euler.y, euler.z]}
            castShadow
          >
            <cylinderGeometry args={[branch.width * 0.7, branch.width, length, 6]} />
            <meshStandardMaterial color={tree.trunkColor} roughness={0.9} />
          </mesh>
        )
      })}

      {/* Foliage */}
      {tree.foliage.map((foliage, i) => (
        <mesh
          key={`foliage-${i}`}
          position={foliage.position}
          castShadow
        >
          <sphereGeometry args={[foliage.scale, 8, 6]} />
          <meshStandardMaterial
            color={tree.foliageColor}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// =============================================================================
// Rock Renderer
// =============================================================================

function RockMesh({
  type = 'boulder',
  position,
  rotation = [0, 0, 0],
  scale = 1,
  seed
}: {
  type: 'boulder' | 'jagged' | 'smooth' | 'flat'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  seed?: number
}) {
  const rock = useMemo(() => generateRock(scale, seed || Date.now(), type), [scale, seed, type])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(rock.vertices, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(rock.normals, 3))
    geo.setIndex(rock.indices)
    return geo
  }, [rock])

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={rock.color}
        roughness={rock.roughness}
        metalness={rock.metalness}
      />
    </mesh>
  )
}

// =============================================================================
// GLB Asset Loader
// =============================================================================

function LoadedAsset({
  assetId,
  position,
  rotation = [0, 0, 0],
  scale = 1
}: {
  assetId: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const assetInfo = getAssetById(assetId)
  if (!assetInfo) {
    console.warn(`Asset not found: ${assetId}`)
    return null
  }

  return (
    <Suspense fallback={<AssetPlaceholder position={position} scale={scale} />}>
      <GLBModel
        url={getAssetUrl(assetInfo)}
        position={position}
        rotation={rotation}
        scale={scale * (assetInfo.scale || 1)}
        yOffset={assetInfo.yOffset || 0}
      />
    </Suspense>
  )
}

function GLBModel({
  url,
  position,
  rotation,
  scale,
  yOffset
}: {
  url: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  yOffset: number
}) {
  try {
    const { scene } = useGLTF(url)
    const clonedScene = useMemo(() => scene.clone(), [scene])

    // Apply shadows to all meshes
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return (
      <primitive
        object={clonedScene}
        position={[position[0], position[1] + yOffset, position[2]]}
        rotation={rotation}
        scale={[scale, scale, scale]}
      />
    )
  } catch {
    // Fallback if model fails to load
    return <AssetPlaceholder position={position} scale={scale} />
  }
}

function AssetPlaceholder({
  position,
  scale
}: {
  position: [number, number, number]
  scale: number
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[scale, scale, scale]} />
      <meshStandardMaterial color="#666666" wireframe />
    </mesh>
  )
}

// =============================================================================
// Animated Grass (Instanced)
// =============================================================================

function GrassPatch({
  centerX,
  centerZ,
  radius,
  density = 50,
  color = '#3a5f0b'
}: {
  centerX: number
  centerZ: number
  radius: number
  density?: number
  color?: string
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = density

  const { matrices, dummy } = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const dist = Math.sqrt(Math.random()) * radius

      const x = centerX + Math.cos(angle) * dist
      const z = centerZ + Math.sin(angle) * dist
      const y = 0

      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(0.05, 0.1 + Math.random() * 0.15, 0.05)
      dummy.updateMatrix()
      matrices.push(dummy.matrix.clone())
    }

    return { matrices, dummy }
  }, [centerX, centerZ, radius, count])

  // Set up instanced matrices
  useMemo(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current!.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [matrices])

  // Animate grass swaying
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const time = clock.getElapsedTime()

    for (let i = 0; i < count; i++) {
      const baseMatrix = matrices[i]
      dummy.position.setFromMatrixPosition(baseMatrix)
      dummy.scale.setFromMatrixScale(baseMatrix)

      // Sway animation
      const sway = Math.sin(time * 2 + dummy.position.x * 0.5 + dummy.position.z * 0.3) * 0.1
      dummy.rotation.set(sway, Math.random() * Math.PI * 2, sway * 0.5)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
      <coneGeometry args={[1, 1, 4]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// =============================================================================
// Standard Object Renderer (for non-procedural objects)
// =============================================================================

function GeneratedMesh({ object }: { object: GeneratedObject }) {
  const geometry = useMemo(() => {
    switch (object.type) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
      case 'cone':
        return <coneGeometry args={[0.5, 1, 32]} />
      case 'plane':
        return <planeGeometry args={[1, 1]} />
      case 'torus':
        return <torusGeometry args={[0.5, 0.2, 16, 48]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }, [object.type])

  const material = useMemo(() => {
    const mat = object.material
    return (
      <meshStandardMaterial
        color={mat.color}
        metalness={mat.metalness ?? 0}
        roughness={mat.roughness ?? 0.5}
        emissive={mat.emissive ?? '#000000'}
        emissiveIntensity={mat.emissiveIntensity ?? 0}
        transparent={mat.transparent ?? false}
        opacity={mat.opacity ?? 1}
        side={object.type === 'plane' ? THREE.DoubleSide : THREE.FrontSide}
      />
    )
  }, [object.material, object.type])

  if (object.type === 'group' && object.children) {
    return (
      <group
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
      >
        {object.children.map((child) => (
          <GeneratedMesh key={child.id} object={child} />
        ))}
      </group>
    )
  }

  return (
    <mesh
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      castShadow={object.castShadow ?? true}
      receiveShadow={object.receiveShadow ?? true}
    >
      {geometry}
      {material}
    </mesh>
  )
}

// =============================================================================
// Light Renderer
// =============================================================================

function GeneratedLightSource({ light }: { light: GeneratedLight }) {
  switch (light.type) {
    case 'ambient':
      return <ambientLight color={light.color} intensity={light.intensity} />

    case 'directional':
      return (
        <directionalLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [5, 10, 5]}
          castShadow={light.castShadow ?? true}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
      )

    case 'point':
      return (
        <pointLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [0, 5, 0]}
          castShadow={light.castShadow ?? false}
          distance={light.distance ?? 0}
          decay={2}
        />
      )

    case 'spot':
      return (
        <spotLight
          color={light.color}
          intensity={light.intensity}
          position={light.position || [0, 10, 0]}
          castShadow={light.castShadow ?? true}
          angle={light.angle ?? Math.PI / 6}
          penumbra={light.penumbra ?? 0.5}
          distance={light.distance ?? 0}
          decay={2}
        />
      )

    default:
      return null
  }
}

// =============================================================================
// Main Enhanced Scene Renderer
// =============================================================================

export function EnhancedSceneRenderer({ scene }: { scene: EnhancedGeneratedScene }) {
  return (
    <>
      {/* Background */}
      <color attach="background" args={[scene.background.color]} />

      {/* Fog */}
      {scene.background.fog && (
        <fog
          attach="fog"
          args={[
            scene.background.fog.color,
            scene.background.fog.near,
            scene.background.fog.far,
          ]}
        />
      )}

      {/* Lights */}
      {scene.lights.map((light) => (
        <GeneratedLightSource key={light.id} light={light} />
      ))}

      {/* Procedural Terrain */}
      {scene.terrain && <TerrainMesh config={scene.terrain} />}

      {/* Procedural Vegetation */}
      {scene.vegetation?.trees?.map((tree) => (
        <TreeMesh
          key={tree.id}
          type={tree.type}
          position={tree.position}
          rotation={tree.rotation}
          scale={tree.scale}
          seed={tree.seed}
        />
      ))}

      {scene.vegetation?.rocks?.map((rock) => (
        <RockMesh
          key={rock.id}
          type={rock.type}
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
          seed={rock.seed}
        />
      ))}

      {/* Grass patches (if enabled) */}
      {scene.vegetation?.grass?.enabled && (
        <>
          <GrassPatch centerX={0} centerZ={0} radius={5} density={100} color={scene.vegetation.grass.color} />
          <GrassPatch centerX={3} centerZ={-2} radius={3} density={60} color={scene.vegetation.grass.color} />
          <GrassPatch centerX={-4} centerZ={2} radius={4} density={80} color={scene.vegetation.grass.color} />
        </>
      )}

      {/* Loaded GLB Assets */}
      {scene.assets?.map((asset) => (
        <LoadedAsset
          key={asset.id}
          assetId={asset.assetId}
          position={asset.position}
          rotation={asset.rotation}
          scale={asset.scale}
        />
      ))}

      {/* Standard Generated Objects (primitives) */}
      {scene.objects.map((object) => (
        <GeneratedMesh key={object.id} object={object} />
      ))}
    </>
  )
}

// =============================================================================
// Enhanced Scene Info Overlay
// =============================================================================

export function EnhancedSceneInfo({ scene }: { scene: EnhancedGeneratedScene }) {
  const treeCount = scene.vegetation?.trees?.length || 0
  const rockCount = scene.vegetation?.rocks?.length || 0
  const assetCount = scene.assets?.length || 0
  const hasTerrain = !!scene.terrain

  return (
    <div className="absolute bottom-4 left-4 p-3 bg-bg-secondary/90 border border-surface-border max-w-xs">
      <h3 className="text-sm font-mono text-accent-primary font-bold">{scene.name}</h3>
      <p className="text-xs text-gray-400 mt-1">{scene.description}</p>

      <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono text-gray-500">
        <span>Objects: {scene.metadata.objectCount}</span>
        <span>Lights: {scene.metadata.lightCount}</span>
        {hasTerrain && <span className="text-accent-secondary">Terrain</span>}
        {treeCount > 0 && <span className="text-green-500">Trees: {treeCount}</span>}
        {rockCount > 0 && <span className="text-gray-400">Rocks: {rockCount}</span>}
        {assetCount > 0 && <span className="text-accent-primary">Assets: {assetCount}</span>}
      </div>

      {scene.terrain && (
        <div className="mt-2 text-[10px] font-mono text-gray-600">
          Terrain: {scene.terrain.width}x{scene.terrain.depth} ({scene.terrain.biome || 'custom'})
        </div>
      )}
    </div>
  )
}