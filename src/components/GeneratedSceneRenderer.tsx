import { useMemo } from 'react'
import * as THREE from 'three'
import type { GeneratedScene, GeneratedObject, GeneratedLight } from '../types/procedural'

// Render a single generated object
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

// Render a single generated light
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
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
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

// Main scene renderer
export function GeneratedSceneRenderer({ scene }: { scene: GeneratedScene }) {
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

      {/* Objects */}
      {scene.objects.map((object) => (
        <GeneratedMesh key={object.id} object={object} />
      ))}
    </>
  )
}

// Scene info overlay component
export function SceneInfo({ scene }: { scene: GeneratedScene }) {
  return (
    <div className="absolute bottom-4 left-4 p-3 bg-bg-secondary/90 border border-surface-border max-w-xs">
      <h3 className="text-sm font-mono text-accent-primary font-bold">{scene.name}</h3>
      <p className="text-xs text-gray-400 mt-1">{scene.description}</p>
      <div className="flex gap-4 mt-2 text-xs font-mono text-gray-500">
        <span>Objects: {scene.metadata.objectCount}</span>
        <span>Lights: {scene.metadata.lightCount}</span>
      </div>
    </div>
  )
}
