/**
 * Generates all Hidden Camden narration MP3s via ElevenLabs TTS.
 * Run: ELEVEN_API_KEY=sk_... pnpm dlx tsx scripts/generate-audio.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { AUDIO_FILES } from '../lib/tour/audioScripts'

const VOICE_ID = 'Yex236tJMytMYoUWKVSJ'
const API_KEY = process.env.ELEVEN_API_KEY ?? ''
const MODEL = 'eleven_multilingual_v2'
const OUTPUT_DIR = join(process.cwd(), 'public/audio')

if (!API_KEY) {
  console.error('Set ELEVEN_API_KEY env var')
  process.exit(1)
}

async function generateAudio(text: string, filename: string): Promise<void> {
  const outputPath = join(OUTPUT_DIR, filename)
  if (existsSync(outputPath)) {
    console.log(`  skip  ${filename} (already exists)`)
    return
  }

  process.stdout.write(`  gen   ${filename} ...`)
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    process.stdout.write(` FAILED\n`)
    throw new Error(`ElevenLabs ${res.status} for ${filename}: ${err}`)
  }

  const buffer = await res.arrayBuffer()
  writeFileSync(outputPath, Buffer.from(buffer))
  process.stdout.write(` ${(buffer.byteLength / 1024).toFixed(0)}KB\n`)
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`Generating ${AUDIO_FILES.length} audio files → public/audio/\n`)

  for (const { filename, text } of AUDIO_FILES) {
    await generateAudio(text, filename)
    await new Promise((r) => setTimeout(r, 800))
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
