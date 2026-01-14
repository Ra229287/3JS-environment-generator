import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Ensure .envforge directory exists
const envforgeDir = path.join(__dirname, '.envforge')
if (!fs.existsSync(envforgeDir)) {
  fs.mkdirSync(envforgeDir, { recursive: true })
}

const pendingFile = path.join(envforgeDir, 'pending-request.json')
const resultFile = path.join(envforgeDir, 'result.json')

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'envforge-bridge' })
})

// Submit generation request (from UI)
app.post('/api/generation/request', (req, res) => {
  try {
    const { prompt, benchmarks, style } = req.body
    const requestId = `gen-${Date.now()}`

    const request = {
      requestId,
      timestamp: new Date().toISOString(),
      prompt,
      benchmarks,
      style,
      status: 'pending'
    }

    fs.writeFileSync(pendingFile, JSON.stringify(request, null, 2))

    // Clear any old result
    if (fs.existsSync(resultFile)) {
      fs.unlinkSync(resultFile)
    }

    console.log(`[EnvForge] New generation request: ${requestId}`)
    console.log(`[EnvForge] Prompt: ${prompt.substring(0, 100)}...`)

    res.json({ success: true, requestId })
  } catch (err) {
    console.error('[EnvForge] Error creating request:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Check for pending request (for Claude Code to poll)
app.get('/api/generation/pending', (req, res) => {
  try {
    if (fs.existsSync(pendingFile)) {
      const content = fs.readFileSync(pendingFile, 'utf-8')
      const request = JSON.parse(content)
      res.json({ pending: true, ...request })
    } else {
      res.json({ pending: false })
    }
  } catch (err) {
    res.json({ pending: false, error: err.message })
  }
})

// Submit generation result (from Claude Code)
app.post('/api/generation/result', (req, res) => {
  try {
    const { requestId, scene, error } = req.body

    const result = {
      requestId,
      timestamp: new Date().toISOString(),
      success: !error,
      scene: scene || null,
      error: error || null
    }

    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2))

    // Clear pending request
    if (fs.existsSync(pendingFile)) {
      fs.unlinkSync(pendingFile)
    }

    console.log(`[EnvForge] Result received for: ${requestId}`)

    res.json({ success: true })
  } catch (err) {
    console.error('[EnvForge] Error saving result:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Poll for result (from UI)
app.get('/api/generation/result', (req, res) => {
  try {
    if (fs.existsSync(resultFile)) {
      const content = fs.readFileSync(resultFile, 'utf-8')
      const result = JSON.parse(content)

      // Clear result after reading
      fs.unlinkSync(resultFile)

      res.json({ hasResult: true, ...result })
    } else {
      res.json({ hasResult: false })
    }
  } catch (err) {
    res.json({ hasResult: false, error: err.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(``)
  console.log(`🔧 EnvForge Bridge Server running on http://localhost:${PORT}`)
  console.log(``)
  console.log(`Endpoints:`)
  console.log(`  POST /api/generation/request  - Submit generation request`)
  console.log(`  GET  /api/generation/pending  - Check for pending request`)
  console.log(`  POST /api/generation/result   - Submit generation result`)
  console.log(`  GET  /api/generation/result   - Poll for result`)
  console.log(``)
})
