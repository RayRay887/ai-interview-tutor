import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function openAiTtsDevProxy(apiKey: string | undefined): Plugin {
  return {
    name: 'openai-tts-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        if (pathname !== '/api/text-to-speech' || req.method !== 'POST') {
          next()
          return
        }

        if (!apiKey) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Add OPENAI_API_KEY to your .env file.' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', () => resolve())
            req.on('error', reject)
          })

          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { text?: string }
          const text = body.text?.trim().slice(0, 800)

          if (!text) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing text.' }))
            return
          }

          const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'tts-1',
              voice: 'nova',
              input: text,
              response_format: 'mp3',
            }),
          })

          if (!response.ok) {
            const details = await response.text()
            console.error('[openai-tts]', details)
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'OpenAI TTS request failed.' }))
            return
          }

          const audioBuffer = Buffer.from(await response.arrayBuffer())
          const audioBase64 = audioBuffer.toString('base64')

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ audioBase64 }))
        } catch (error) {
          console.error('[openai-tts]', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'TTS proxy error.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), openAiTtsDevProxy(env.OPENAI_API_KEY)],
  }
})
