import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Stars, PerspectiveCamera } from '@react-three/drei'
import { useEnvironmentStore } from '../store/environment'
import { useRef, useState } from 'react'

// FPS counter hook
function useFPS() {
  const [fps, setFps] = useState(60)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      setFps(frames.current)
      frames.current = 0
      lastTime.current = now
    }
  })

  return fps
}

// FPS Display component (inside Canvas)
function FPSCounter({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const fps = useFPS()
  useFrame(() => {
    onFpsUpdate(fps)
  })
  return null
}

// Floor component based on config
function Floor() {
  const { floor } = useEnvironmentStore((s) => s.config)

  if (floor.type === 'none') return null

  if (floor.type === 'grid') {
    return (
      <Grid
        position={[0, 0, 0]}
        args={[floor.size, floor.size]}
        cellSize={floor.cellSize}
        cellThickness={0.5}
        cellColor={floor.gridColor}
        sectionSize={floor.cellSize * 5}
        sectionThickness={1}
        sectionColor={floor.gridColor}
        fadeDistance={floor.size}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
    )
  }

  if (floor.type === 'solid') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[floor.size, floor.size]} />
        <meshStandardMaterial color={floor.color} />
      </mesh>
    )
  }

  if (floor.type === 'platform') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[floor.size / 2, 64]} />
        <meshStandardMaterial color={floor.color} />
      </mesh>
    )
  }

  return null
}

// Lighting component based on config
function Lighting() {
  const { lighting } = useEnvironmentStore((s) => s.config)

  return (
    <>
      <ambientLight
        intensity={lighting.ambient.intensity}
        color={lighting.ambient.color}
      />
      <directionalLight
        intensity={lighting.directional.intensity}
        color={lighting.directional.color}
        position={lighting.directional.position}
        castShadow={lighting.directional.castShadow}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  )
}

// Background component based on config
function Background() {
  const { background } = useEnvironmentStore((s) => s.config)

  return (
    <>
      <color attach="background" args={[background.color]} />
      {background.fog.enabled && (
        <fog
          attach="fog"
          args={[background.fog.color, background.fog.near, background.fog.far]}
        />
      )}
      {background.stars.enabled && (
        <Stars
          radius={100}
          depth={50}
          count={background.stars.count}
          factor={4}
          saturation={0}
          fade
          speed={background.stars.speed}
        />
      )}
    </>
  )
}

// Simple character placeholder
function SimpleCharacter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
        <meshStandardMaterial color="#9D8CFF" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#9D8CFF" />
      </mesh>
    </group>
  )
}

// Character preview
function Characters() {
  const showCharacters = useEnvironmentStore((s) => s.showCharacters)
  const { characterOffset } = useEnvironmentStore((s) => s.config)

  if (!showCharacters) return null

  return (
    <>
      <SimpleCharacter position={[characterOffset.x - 1, characterOffset.y, characterOffset.z]} />
      <SimpleCharacter position={[characterOffset.x + 1, characterOffset.y, characterOffset.z]} />
    </>
  )
}

// Scene content
function Scene({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const { cameraPosition, cameraTarget } = useEnvironmentStore((s) => s.config)

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={50}
      />
      <OrbitControls target={cameraTarget} />

      <FPSCounter onFpsUpdate={onFpsUpdate} />
      <Background />
      <Lighting />
      <Floor />
      <Characters />
    </>
  )
}

// Main Preview component
export function Preview() {
  const [fps, setFps] = useState(60)

  return (
    <div className="relative w-full h-full">
      <Canvas shadows>
        <Scene onFpsUpdate={setFps} />
      </Canvas>

      {/* FPS Counter Overlay */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-bg-secondary/80 border border-surface-border">
        <span className={`font-mono text-xs ${fps >= 55 ? 'text-accent-primary' : fps >= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
          FPS: {fps}
        </span>
      </div>
    </div>
  )
}
