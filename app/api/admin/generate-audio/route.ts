import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { z } from 'zod'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import { AUDIO_FILES } from '@/lib/tour/audioScripts'

export const maxDuration = 300

const VOICE_ID = 'Yex236tJMytMYoUWKVSJ'
const MODEL = 'eleven_multilingual_v2'

// GET — return status of all audio files in blob storage
export async function GET() {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  try {
    const { blobs } = await list({ prefix: 'audio/' })
    const uploaded = new Set(blobs.map((b) => b.pathname.replace('audio/', '')))

    return NextResponse.json(
      AUDIO_FILES.map((f) => ({
        filename: f.filename,
        label: f.label,
        exists: uploaded.has(f.filename),
        url: blobs.find((b) => b.pathname === `audio/${f.filename}`)?.url ?? null,
      })),
    )
  } catch {
    // BLOB_READ_WRITE_TOKEN not configured — return pending state
    return NextResponse.json(
      AUDIO_FILES.map((f) => ({ filename: f.filename, label: f.label, exists: false, url: null })),
    )
  }
}

const bodySchema = z.object({ filename: z.string() })

// POST — generate one file and upload to Vercel Blob
export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const apiKey = process.env.ELEVEN_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVEN_API_KEY not set in environment.' }, { status: 500 })
  }

  const parse = bodySchema.safeParse(await req.json())
  if (!parse.success) {
    return NextResponse.json({ error: 'filename required' }, { status: 400 })
  }

  const file = AUDIO_FILES.find((f) => f.filename === parse.data.filename)
  if (!file) {
    return NextResponse.json({ error: `Unknown file: ${parse.data.filename}` }, { status: 404 })
  }

  let ttsRes: Response
  try {
    ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: file.text,
          model_id: MODEL,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(240_000),
      },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-audio] ElevenLabs fetch failed:', msg)
    return NextResponse.json({ error: `ElevenLabs connection failed: ${msg}` }, { status: 502 })
  }

  if (!ttsRes.ok) {
    const err = await ttsRes.text().catch(() => '')
    console.error('[generate-audio] ElevenLabs error', ttsRes.status, err)
    return NextResponse.json(
      { error: `ElevenLabs error (${ttsRes.status}): ${err}` },
      { status: 502 },
    )
  }

  const audioBuffer = await ttsRes.arrayBuffer()
  console.log('[generate-audio] TTS done, uploading to blob:', file.filename, Math.round(audioBuffer.byteLength / 1024), 'KB')

  let url: string
  try {
    const result = await put(`audio/${file.filename}`, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
    })
    url = result.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-audio] Blob upload failed:', msg)
    return NextResponse.json({ error: `Blob upload failed: ${msg}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, filename: file.filename, url, sizeKb: Math.round(audioBuffer.byteLength / 1024) })
}
