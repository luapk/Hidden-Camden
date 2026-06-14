'use client'

import { useEffect, useState, useCallback } from 'react'

interface FileStatus {
  filename: string
  label: string
  exists: boolean
  url: string | null
  state?: 'idle' | 'generating' | 'done' | 'error'
  error?: string
  sizeKb?: number
}

export default function GenerateAudioClient() {
  const [files, setFiles] = useState<FileStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [blobBase, setBlobBase] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/admin/generate-audio')
    const data = (await res.json()) as FileStatus[]
    setFiles(data.map((f) => ({ ...f, state: 'idle' })))
    setLoading(false)

    // Derive blob base from first existing URL
    const firstUrl = data.find((f) => f.url)?.url
    if (firstUrl) {
      const u = new URL(firstUrl)
      setBlobBase(`${u.protocol}//${u.host}`)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const generateOne = async (filename: string): Promise<void> => {
    setFiles((prev) =>
      prev.map((f) => f.filename === filename ? { ...f, state: 'generating', error: undefined } : f),
    )

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 270_000)
    let res: Response
    try {
      res = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
        signal: controller.signal,
      })
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.filename === filename ? { ...f, state: 'error', error: 'Request timed out. Try generating this file individually.' } : f,
        ),
      )
      return
    } finally {
      clearTimeout(timeout)
    }

    const data = (await res.json()) as { ok?: boolean; url?: string; sizeKb?: number; error?: string }

    if (res.ok && data.ok) {
      setFiles((prev) =>
        prev.map((f) =>
          f.filename === filename
            ? { ...f, state: 'done', exists: true, url: data.url ?? null, sizeKb: data.sizeKb }
            : f,
        ),
      )
      if (data.url && !blobBase) {
        const u = new URL(data.url)
        setBlobBase(`${u.protocol}//${u.host}`)
      }
    } else {
      setFiles((prev) =>
        prev.map((f) =>
          f.filename === filename ? { ...f, state: 'error', error: data.error ?? 'Failed' } : f,
        ),
      )
    }
  }

  const generateAll = async () => {
    setRunning(true)
    const pending = files.filter((f) => !f.exists || f.state === 'error')
    for (const f of pending) {
      await generateOne(f.filename)
      await new Promise((r) => setTimeout(r, 600))
    }
    setRunning(false)
  }

  const doneCount = files.filter((f) => f.exists || f.state === 'done').length
  const total = files.length

  if (loading) {
    return <p style={{ padding: '2rem', color: '#8A8077' }}>Checking blob storage...</p>
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-anton, sans-serif)', fontSize: '1.5rem', textTransform: 'uppercase', margin: 0 }}>
          Audio Generation
        </h1>
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8A8077' }}>
          {doneCount}/{total} files
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#2A2520', marginBottom: '1.5rem' }}>
        <div style={{ height: '100%', background: '#C9933C', width: `${(doneCount / total) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Generate all */}
      {doneCount < total && (
        <button
          onClick={generateAll}
          disabled={running}
          style={{
            marginBottom: '1.5rem',
            background: running ? '#2A2520' : '#C9933C',
            color: running ? '#8A8077' : '#000',
            border: 'none',
            padding: '0.6rem 1.25rem',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Generating...' : `Generate remaining (${total - doneCount})`}
        </button>
      )}

      {/* File list */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <tbody>
          {files.map((f) => {
            const isDone = f.exists || f.state === 'done'
            const isGenerating = f.state === 'generating'
            const isError = f.state === 'error'

            return (
              <tr key={f.filename} style={{ borderBottom: '1px solid #2A2520' }}>
                <td style={{ padding: '0.6rem 0.5rem 0.6rem 0', width: 20 }}>
                  {isGenerating ? (
                    <span style={{ color: '#C9933C' }}>...</span>
                  ) : isDone ? (
                    <span style={{ color: '#84CC16' }}>✓</span>
                  ) : isError ? (
                    <span style={{ color: '#D8432F' }}>✗</span>
                  ) : (
                    <span style={{ color: '#3A3530' }}>○</span>
                  )}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', color: isDone ? '#F0E6D2' : '#8A8077' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#C9933C' }}>{f.filename}</div>
                  <div style={{ marginTop: 2 }}>{f.label}</div>
                  {isError && (
                    <div style={{ color: '#D8432F', fontSize: '0.7rem', marginTop: 2 }}>{f.error}</div>
                  )}
                </td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {f.sizeKb && (
                    <span style={{ color: '#8A8077', fontFamily: 'monospace', fontSize: '0.7rem', marginRight: '0.5rem' }}>
                      {f.sizeKb}KB
                    </span>
                  )}
                  {!isDone && !isGenerating && (
                    <button
                      onClick={() => generateOne(f.filename)}
                      disabled={running}
                      style={{
                        background: 'none',
                        border: '1px solid #3A3530',
                        color: '#8A8077',
                        padding: '0.2rem 0.5rem',
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                      }}
                    >
                      Gen
                    </button>
                  )}
                  {isDone && f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#8A8077', fontFamily: 'monospace', fontSize: '0.65rem' }}
                    >
                      Play
                    </a>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Env var hint once all done */}
      {doneCount === total && blobBase && (
        <div style={{ marginTop: '2rem', background: '#1A1714', padding: '1rem', border: '1px solid #2A2520' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#8A8077', margin: '0 0 0.5rem' }}>
            All done. Add this to Vercel environment variables:
          </p>
          <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#C9933C', display: 'block', wordBreak: 'break-all' }}>
            NEXT_PUBLIC_AUDIO_BASE={blobBase}
          </code>
          <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#8A8077', margin: '0.5rem 0 0' }}>
            Then redeploy for audio to go live.
          </p>
        </div>
      )}
    </div>
  )
}
