import type { EnvironmentConfig } from '../store/environment'

export function generateEnvironmentCode(config: EnvironmentConfig): string {
  const imports = generateImports(config)
  const envConfig = generateEnvConfig(config)
  const components = generateComponents(config)
  const mainComponent = generateMainComponent(config)

  return `${imports}

${envConfig}

${components}

${mainComponent}
`
}

function generateImports(config: EnvironmentConfig): string {
  const imports = [
    "import { Canvas } from '@react-three/fiber'",
    "import { OrbitControls, PerspectiveCamera } from '@react-three/drei'",
  ]

  if (config.floor.type === 'grid') {
    imports.push("import { Grid } from '@react-three/drei'")
  }

  if (config.background.stars.enabled) {
    imports.push("import { Stars } from '@react-three/drei'")
  }

  // Dedupe drei imports
  const dreiImports = imports.filter(i => i.includes('@react-three/drei'))
  const otherImports = imports.filter(i => !i.includes('@react-three/drei'))

  if (dreiImports.length > 1) {
    const allDreiComponents = dreiImports
      .map(i => i.match(/\{ (.+) \}/)?.[1] || '')
      .join(', ')
    return [...otherImports, `import { ${allDreiComponents} } from '@react-three/drei'`].join('\n')
  }

  return imports.join('\n')
}

function generateEnvConfig(config: EnvironmentConfig): string {
  return `// Environment Configuration
const ENV_CONFIG = {
  floor: {
    type: '${config.floor.type}',
    size: ${config.floor.size},
    color: '${config.floor.color}',
    gridColor: '${config.floor.gridColor}',
    cellSize: ${config.floor.cellSize},
  },
  lighting: {
    ambient: {
      intensity: ${config.lighting.ambient.intensity},
      color: '${config.lighting.ambient.color}',
    },
    directional: {
      intensity: ${config.lighting.directional.intensity},
      color: '${config.lighting.directional.color}',
      position: [${config.lighting.directional.position.join(', ')}],
      castShadow: ${config.lighting.directional.castShadow},
    },
  },
  background: {
    color: '${config.background.color}',
    fog: {
      enabled: ${config.background.fog.enabled},
      color: '${config.background.fog.color}',
      near: ${config.background.fog.near},
      far: ${config.background.fog.far},
    },
    stars: {
      enabled: ${config.background.stars.enabled},
      count: ${config.background.stars.count},
      speed: ${config.background.stars.speed},
    },
  },
  camera: {
    position: [${config.cameraPosition.join(', ')}],
    target: [${config.cameraTarget.join(', ')}],
  },
}`
}

function generateComponents(config: EnvironmentConfig): string {
  const components: string[] = []

  // Floor component
  if (config.floor.type !== 'none') {
    components.push(generateFloorComponent(config))
  }

  // Lighting component
  components.push(generateLightingComponent())

  // Background component
  components.push(generateBackgroundComponent(config))

  return components.join('\n\n')
}

function generateFloorComponent(config: EnvironmentConfig): string {
  if (config.floor.type === 'grid') {
    return `function Floor() {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[ENV_CONFIG.floor.size, ENV_CONFIG.floor.size]}
      cellSize={ENV_CONFIG.floor.cellSize}
      cellThickness={0.5}
      cellColor={ENV_CONFIG.floor.gridColor}
      sectionSize={ENV_CONFIG.floor.cellSize * 5}
      sectionThickness={1}
      sectionColor={ENV_CONFIG.floor.gridColor}
      fadeDistance={ENV_CONFIG.floor.size}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={false}
    />
  )
}`
  }

  if (config.floor.type === 'solid') {
    return `function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[ENV_CONFIG.floor.size, ENV_CONFIG.floor.size]} />
      <meshStandardMaterial color={ENV_CONFIG.floor.color} />
    </mesh>
  )
}`
  }

  if (config.floor.type === 'platform') {
    return `function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[ENV_CONFIG.floor.size / 2, 64]} />
      <meshStandardMaterial color={ENV_CONFIG.floor.color} />
    </mesh>
  )
}`
  }

  return ''
}

function generateLightingComponent(): string {
  return `function Lighting() {
  return (
    <>
      <ambientLight
        intensity={ENV_CONFIG.lighting.ambient.intensity}
        color={ENV_CONFIG.lighting.ambient.color}
      />
      <directionalLight
        intensity={ENV_CONFIG.lighting.directional.intensity}
        color={ENV_CONFIG.lighting.directional.color}
        position={ENV_CONFIG.lighting.directional.position}
        castShadow={ENV_CONFIG.lighting.directional.castShadow}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  )
}`
}

function generateBackgroundComponent(config: EnvironmentConfig): string {
  const parts: string[] = ['<color attach="background" args={[ENV_CONFIG.background.color]} />']

  if (config.background.fog.enabled) {
    parts.push(`{ENV_CONFIG.background.fog.enabled && (
        <fog
          attach="fog"
          args={[
            ENV_CONFIG.background.fog.color,
            ENV_CONFIG.background.fog.near,
            ENV_CONFIG.background.fog.far,
          ]}
        />
      )}`)
  }

  if (config.background.stars.enabled) {
    parts.push(`{ENV_CONFIG.background.stars.enabled && (
        <Stars
          radius={100}
          depth={50}
          count={ENV_CONFIG.background.stars.count}
          factor={4}
          saturation={0}
          fade
          speed={ENV_CONFIG.background.stars.speed}
        />
      )}`)
  }

  return `function Background() {
  return (
    <>
      ${parts.join('\n      ')}
    </>
  )
}`
}

function generateMainComponent(config: EnvironmentConfig): string {
  const floorComponent = config.floor.type !== 'none' ? '<Floor />' : '{/* No floor */}'

  return `function Scene() {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={ENV_CONFIG.camera.position}
        fov={50}
      />
      <OrbitControls target={ENV_CONFIG.camera.target} />
      <Background />
      <Lighting />
      ${floorComponent}
      {/* Add your 3D content here */}
    </>
  )
}

export function Environment() {
  return (
    <Canvas shadows style={{ width: '100%', height: '100%' }}>
      <Scene />
    </Canvas>
  )
}`
}

// Generate a minimal snippet for quick copy
export function generateMinimalCode(config: EnvironmentConfig): string {
  return `<Canvas shadows>
  <PerspectiveCamera makeDefault position={[${config.cameraPosition.join(', ')}]} fov={50} />
  <OrbitControls target={[${config.cameraTarget.join(', ')}]} />
  <color attach="background" args={['${config.background.color}']} />
  <ambientLight intensity={${config.lighting.ambient.intensity}} color="${config.lighting.ambient.color}" />
  <directionalLight
    intensity={${config.lighting.directional.intensity}}
    color="${config.lighting.directional.color}"
    position={[${config.lighting.directional.position.join(', ')}]}
    castShadow
  />
  {/* Add your 3D content here */}
</Canvas>`
}
