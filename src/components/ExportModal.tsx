import { useState } from 'react'
import { useEnvironmentStore } from '../store/environment'
import { generateEnvironmentCode, generateMinimalCode } from '../lib/codeGenerator'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ExportMode = 'full' | 'minimal'

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const config = useEnvironmentStore((s) => s.config)
  const [mode, setMode] = useState<ExportMode>('full')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const code = mode === 'full' ? generateEnvironmentCode(config) : generateMinimalCode(config)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'full' ? 'Environment.tsx' : 'environment-snippet.tsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-bg-secondary border border-surface-border flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-accent-primary font-mono">Export Code</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setMode('full')}
                className={`px-3 py-1 text-xs font-mono transition-colors ${
                  mode === 'full'
                    ? 'bg-accent-primary text-bg-primary'
                    : 'bg-surface-border/50 text-gray-400 hover:bg-surface-border'
                }`}
              >
                Full Component
              </button>
              <button
                onClick={() => setMode('minimal')}
                className={`px-3 py-1 text-xs font-mono transition-colors ${
                  mode === 'minimal'
                    ? 'bg-accent-primary text-bg-primary'
                    : 'bg-surface-border/50 text-gray-400 hover:bg-surface-border'
                }`}
              >
                Minimal Snippet
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* Code Display */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="bg-bg-primary p-4 border border-surface-border overflow-auto text-sm font-mono text-gray-300 whitespace-pre">
            {code}
          </pre>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between p-4 border-t border-surface-border">
          <p className="text-xs text-gray-500">
            {mode === 'full' ? 'Complete React component with ENV_CONFIG' : 'Quick snippet for existing projects'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-mono text-gray-400 border border-surface-border hover:border-gray-500 transition-colors"
            >
              Download
            </button>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                copied
                  ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary'
                  : 'bg-accent-primary text-bg-primary hover:bg-accent-primary/90'
              }`}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
