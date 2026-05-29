'use client'
import { useState, useCallback } from 'react'

export default function DocumentManager() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<{ name: string; status: 'uploading' | 'done' | 'error' }[]>([])
  const [text, setText] = useState('')
  const [textStatus, setTextStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')

  async function uploadFile(file: File) {
    setFiles(prev => [...prev, { name: file.name, status: 'uploading' }])
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/ingest', { method: 'POST', body: form })
    const status = res.ok ? 'done' : 'error'
    setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status } : f))
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    for (const file of Array.from(e.dataTransfer.files)) await uploadFile(file)
  }, [])

  async function uploadText() {
    if (!text.trim()) return
    setTextStatus('uploading')
    const form = new FormData()
    form.append('text', text)
    const res = await fetch('/api/ingest', { method: 'POST', body: form })
    setTextStatus(res.ok ? 'done' : 'error')
    if (res.ok) setText('')
  }

  return (
    <div className="p-5 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
          ドキュメントを登録
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          登録したドキュメントはRAGボタンONのときに参照されます
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className="rounded-2xl p-10 text-center transition cursor-pointer"
          style={{
            border: `2px dashed ${dragging ? 'rgba(62,207,142,.5)' : 'var(--border)'}`,
            background: dragging ? 'rgba(62,207,142,.05)' : 'transparent',
          }}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept=".txt,.md,.csv,.pdf"
            className="hidden"
            onChange={e => Array.from(e.target.files || []).forEach(uploadFile)}
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ファイルをドラッグ&amp;ドロップ、またはクリックして選択
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', opacity: .5 }}>
            .txt / .md / .csv / .pdf 対応
          </p>
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map(f => (
              <li key={f.name} className="flex items-center gap-2 text-xs">
                <span className={
                  f.status === 'done' ? 'text-green-400' :
                  f.status === 'error' ? 'text-red-400' : ''
                } style={f.status === 'uploading' ? { color: 'var(--text-secondary)' } : undefined}>
                  {f.status === 'done' ? '✓' : f.status === 'error' ? '✗' : '…'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Text input */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
          テキストを直接入力
        </h3>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="栽培マニュアル、農薬データ、注意事項などをここに貼り付け…"
          rows={6}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs">
            {textStatus === 'done' && <span className="text-green-400">登録しました</span>}
            {textStatus === 'error' && <span className="text-red-400">エラーが発生しました</span>}
            {textStatus === 'uploading' && <span style={{ color: 'var(--text-secondary)' }}>登録中…</span>}
          </span>
          <button
            onClick={uploadText}
            disabled={!text.trim() || textStatus === 'uploading'}
            className="text-xs px-4 py-2 rounded-lg font-medium transition disabled:opacity-30"
            style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
          >
            登録
          </button>
        </div>
      </div>
    </div>
  )
}
