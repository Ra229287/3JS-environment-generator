import { useState } from 'react'
import './index.css'
import { Preview } from './components/Preview'
import { Configurator } from './components/Configurator'
import { ProceduralGenerator } from './components/ProceduralGenerator'
import { GeneratedPreview } from './components/GeneratedPreview'
import { useProceduralStore } from './store/procedural'

type TabId = 'configure' | 'generate'

function TabButton({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: TabId
  label: string
  icon: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 font-mono text-sm transition-all border-b-2 ${
        active
          ? id === 'configure'
            ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
            : 'border-accent-secondary text-accent-secondary bg-accent-secondary/5'
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-surface-border/30'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('generate')
  const generatedScene = useProceduralStore((s) => s.generatedScene)

  return (
    <div className="w-full h-full flex bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-80 h-full bg-bg-secondary border-r border-surface-border flex flex-col">
        {/* Logo */}
        <header className="p-4 border-b border-surface-border">
          <h1 className="text-lg font-bold font-mono">
            <span className="text-accent-primary">Env</span>
            <span className="text-accent-secondary">Forge</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI-Powered 3D Environment Generator</p>
        </header>

        {/* Tab Buttons */}
        <div className="flex border-b border-surface-border">
          <TabButton
            id="configure"
            label="Configure"
            icon="⚙"
            active={activeTab === 'configure'}
            onClick={() => setActiveTab('configure')}
          />
          <TabButton
            id="generate"
            label="Generate"
            icon="⚡"
            active={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
          />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'configure' ? <Configurator /> : <ProceduralGenerator />}
        </div>
      </aside>

      {/* Main - 3D Preview */}
      <main className="flex-1 h-full relative">
        {activeTab === 'generate' && generatedScene ? (
          <GeneratedPreview />
        ) : (
          <Preview />
        )}
      </main>
    </div>
  )
}

export default App
