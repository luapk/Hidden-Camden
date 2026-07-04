import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { z } from 'zod'
import { requireAdmin, isAdminError } from '@/lib/admin/auth'
import { AUDIO_FILES, AUDIO_TEXT_ES } from '@/lib/tour/audioScripts'

export const maxDuration = 300

const MODEL = 'eleven_multilingual_v2'

type Lang = 'en' | 'es'

// English voice is the default; Spanish voice is set once provided.
function voiceFor(lang: Lang): string {
  if (lang === 'es') {
    return process.env.ELEVEN_VOICE_ID_ES ?? ''
  }
  return process.env.ELEVEN_VOICE_ID_EN ?? 'Yex236tJMytMYoUWKVSJ'
}

// English lives at audio/<file>; other languages at audio/<lang>/<file>.
function blobPath(lang: Lang, filename: string): string {
  return lang === 'en' ? `audio/${filename}` : `audio/${lang}/${filename}`
}

function textFor(lang: Lang, filename: string, english: string): string {
  if (lang === 'es') return AUDIO_TEXT_ES[filename] ?? ''
  return english
}

// GET — return status of all audio files in blob storage for a language.
// With ?make=<filename>, generate that file instead (same work as POST;
// exists so server-side fetch tools that only speak GET can drive batch
// generation while the admin auth bypass is in place).
export async function GET(req: Request) {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const url = new URL(req.url)
  const lang: Lang = url.searchParams.get('lang') === 'es' ? 'es' : 'en'

  const make = url.searchParams.get('make')
  if (make) {
    return generateOne(make, lang)
  }

  const prefix = lang === 'en' ? 'audio/' : `audio/${lang}/`

  try {
    const { blobs } = await list({ prefix })

    return NextResponse.json(
      AUDIO_FILES.map((f) => {
        const path = blobPath(lang, f.filename)
        return {
          filename: f.filename,
          label: f.label,
          exists: blobs.some((b) => b.pathname === path),
          url: blobs.find((b) => b.pathname === path)?.url ?? null,
        }
      }),
    )
  } catch {
    // BLOB_READ_WRITE_TOKEN not configured — return pending state
    return NextResponse.json(
      AUDIO_FILES.map((f) => ({ filename: f.filename, label: f.label, exists: false, url: null })),
    )
  }
}

const bodySchema = z.object({ filename: z.string(), lang: z.enum(['en', 'es']).optional() })

// POST — generate one file and upload to Vercel Blob
export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isAdminError(ctx)) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const parse = bodySchema.safeParse(await req.json())
  if (!parse.success) {
    return NextResponse.json({ error: 'filename required' }, { status: 400 })
  }

  return generateOne(parse.data.filename, parse.data.lang ?? 'en')
}

async function generateOne(filename: string, lang: Lang): Promise<NextResponse> {
  const apiKey = process.env.ELEVEN_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVEN_API_KEY not set in environment.' }, { status: 500 })
  }

  const file = AUDIO_FILES.find((f) => f.filename === filename)
  if (!file) {
    return NextResponse.json({ error: `Unknown file: ${filename}` }, { status: 404 })
  }

  const voiceId = voiceFor(lang)
  if (!voiceId) {
    return NextResponse.json(
      { error: 'No Spanish voice set. Add ELEVEN_VOICE_ID_ES in Vercel.' },
      { status: 500 },
    )
  }

  const text = textFor(lang, file.filename, file.text)
  if (!text) {
    return NextResponse.json({ error: `No ${lang} script for ${file.filename}` }, { status: 404 })
  }

  let ttsRes: Response
  try {
    ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
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
  const path = blobPath(lang, file.filename)
  console.log('[generate-audio] TTS done, uploading to blob:', path, Math.round(audioBuffer.byteLength / 1024), 'KB')

  let url: string
  try {
    const result = await put(path, audioBuffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    url = result.url
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-audio] Blob upload failed:', msg)
    return NextResponse.json({ error: `Blob upload failed: ${msg}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, filename: file.filename, url, sizeKb: Math.round(audioBuffer.byteLength / 1024) })
}
