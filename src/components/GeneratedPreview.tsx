import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useProceduralStore } from '../store/procedural'
import { EnhancedSceneRenderer, EnhancedSceneInfo } from './EnhancedSceneRenderer'
import type { GeneratedScene } from '../types/procedural'

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

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  )
}

// Scene wrapper with enhanced renderer
function Scene({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const scene = useProceduralStore((s) => s.generatedScene)

  if (!scene) return null

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={scene.camera.position}
        fov={scene.camera.fov}
      />
      <OrbitControls target={scene.camera.target} enableDamping dampingFactor={0.05} />
      <FPSCounter onFpsUpdate={onFpsUpdate} />
      <Suspense fallback={<LoadingFallback />}>
        <EnhancedSceneRenderer scene={scene} />
      </Suspense>
    </>
  )
}

// Main preview component
export function GeneratedPreview() {
  const [fps, setFps] = useState(60)
  const scene = useProceduralStore((s) => s.generatedScene)
  const history = useProceduralStore((s) => s.history)
  const setGeneratedScene = useProceduralStore((s) => s.setGeneratedScene)

  return (
    <div className="relative w-full h-full">
      <Canvas shadows>
        <Scene onFpsUpdate={setFps} />
      </Canvas>

      {/* FPS Counter Overlay */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-bg-secondary/80 border border-surface-border">
        <span
          className={`font-mono text-xs ${
            fps >= 55
              ? 'text-accent-primary'
              : fps >= 30
              ? 'text-yellow-500'
              : 'text-red-500'
          }`}
        >
          FPS: {fps}
        </span>
      </div>

      {/* Scene Info */}
      {scene && <EnhancedSceneInfo scene={scene} />}

      {/* History Navigation */}
      {history.length > 1 && (
        <div className="absolute top-4 left-4 flex gap-2">
          {history.slice(0, 5).map((historyScene, index) => (
            <button
              key={historyScene.metadata.generatedAt}
              onClick={() => setGeneratedScene(historyScene)}
              className={`w-8 h-8 flex items-center justify-center text-xs font-mono transition-colors ${
                scene?.metadata.generatedAt === historyScene.metadata.generatedAt
                  ? 'bg-accent-secondary text-bg-primary'
                  : 'bg-bg-secondary/80 text-gray-400 hover:bg-bg-secondary border border-surface-border'
              }`}
              title={historyScene.name}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!scene && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <p className="text-gray-400 font-mono text-sm">
              Generate a scene to see it here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
