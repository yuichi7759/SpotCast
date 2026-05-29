'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Field, WeatherData } from '@/types/field'
import { calcFieldStatus } from '@/lib/fieldStatus'

interface Message { role: 'user' | 'assistant' | 'error'; content: string }

interface Props {
  selectedField: Field | null
  fields: Field[]
  weather: WeatherData | null
  region: string
}

function getSuggestions(content: string): string[] {
  if (/雨|降水|傘/.test(content))                return ['今週雨が降る日は？', '週末の天気は？']
  if (/台風|暴風|警報/.test(content))            return ['進路を教えて', '影響はいつまで？']
  if (/気温|暑い|寒い|最高|最低/.test(content))  return ['今週の気温推移は？', '過ごしやすい日は？']
  if (/風|強風/.test(content))                   return ['風が弱まる時間は？', '明日の風速は？']
  if (/晴れ|日差し/.test(content))               return ['今週一番晴れる日は？', '週間予報は？']
  if (/予報|明日|週末|週間/.test(content))       return ['7日間予報は？', '時間別予報は？']
  return ['詳しく教えて', '週間天気は？']
}

function marked(md: string): string {
  if (typeof window === 'undefined') return md
  const w = window as unknown as { marked?: { parse: (s: string) => string } }
  return w.marked ? w.marked.parse(md) : md
}

export default function MapChatPanel({ selectedField, fields, weather, region }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [booting, setBooting]   = useState(false)
  const [markedOk, setMarkedOk] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const bootedRef    = useRef(false)
  const prevFieldRef = useRef<string | null>(null)
  // フィールドごとのチャット履歴キャッシュ（APIを再度呼ばない）
  const fieldCacheRef = useRef<Map<string, Message[]>>(new Map())

  // Load marked.js
  useEffect(() => {
    if (document.querySelector('script[src*="marked"]')) { setMarkedOk(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    s.onload = () => setMarkedOk(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, booting])

  // Boot daily plan on first mount
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    streamDailyPlan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch context when field changes
  useEffect(() => {
    const fid = selectedField?.id ?? null
    if (fid === prevFieldRef.current) return
    prevFieldRef.current = fid
    if (!selectedField) return

    // キャッシュがあれば即復元（APIコールなし）
    const cached = fieldCacheRef.current.get(selectedField.id)
    if (cached) {
      setMessages(cached)
      return
    }

    // 初回のみAPIを呼ぶ
    streamFieldIntro(selectedField)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedField])

  async function streamDailyPlan() {
    setBooting(true)
    setMessages([])
    try {
      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No convId — panel doesn't persist to DB
      })
      if (!res.ok) return
      await streamInto(res)
    } finally { setBooting(false) }
  }

  async function streamFieldIntro(field: Field) {
    setMessages([])
    setLoading(true)
    const fieldCtx = `【ポイント情報】「${field.name}」について相談中です。`
    await chatStream([{
      role: 'user',
      content: `${fieldCtx}\nこのポイントの今日の天気と今週の予報を教えてください。`,
    }], fieldCtx, field.id)
  }

  async function chatStream(apiMessages: { role: string; content: string }[], fieldContext?: string, cacheKey?: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, useSearch: false, useRag: false, fieldContext }),
      })
      if (!res.ok) return
      await streamInto(res, cacheKey)
    } finally { setLoading(false) }
  }

  async function streamInto(res: Response, cacheKey?: string) {
    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let accumulated = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) {
            accumulated += parsed.text
            setMessages(prev => {
              const next = [...prev.slice(0, -1), { role: 'assistant' as const, content: accumulated }]
              // ストリーム完了後にキャッシュ保存（cacheKeyがある場合）
              if (cacheKey) fieldCacheRef.current.set(cacheKey, next)
              return next
            })
          }
        } catch {}
      }
    }
  }

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    if (!overrideText) setInput('')
    if (textareaRef.current && !overrideText) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    const apiMessages = newMessages
      .filter(m => m.role !== 'error')
      .map(m => ({ role: m.role as string, content: m.content }))

    const fieldContext = selectedField
      ? `【ポイント情報】「${selectedField.name}」について相談中です。`
      : undefined

    await chatStream(apiMessages, fieldContext, selectedField?.id)
  }, [input, loading, messages, selectedField]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); send()
    }
  }

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')

  const panelW = collapsed ? 48 : 360

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: panelW, zIndex: 20,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.22,1,0.36,1)',
      pointerEvents: 'auto',
    }}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)',
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(8,12,18,0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
          zIndex: 30,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {collapsed ? <path d="M4 3l4 3-4 3"/> : <path d="M8 3l-4 3 4 3"/>}
        </svg>
      </button>

      {!collapsed && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'rgba(8,12,18,0.86)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          {(() => {
            const fs = selectedField ? calcFieldStatus(selectedField) : null
            return (
          <div style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            {/* Icon with status ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
              }}>
                {selectedField ? '📍' : '🌤️'}
              </div>
              {fs && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: fs.color,
                  boxShadow: `0 0 6px ${fs.glowColor}`,
                  border: '1.5px solid rgba(8,12,18,0.9)',
                }}/>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedField ? selectedField.name : 'SpotCast AI'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedField ? selectedField.name + ' の天気' : '今日の天気ブリーフィング'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {selectedField && (
                <button
                  onClick={() => streamDailyPlan()}
                  title="今日の計画に戻る"
                  style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12,
                  }}
                >
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M10 6A4 4 0 012 6"/>
                    <path d="M2 3v3h3"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
            )
          })()}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(booting || (loading && messages.length === 0)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <style>{`@keyframes shimDark{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
                {[70, 100, 85, 60, 90].map((w, i) => (
                  <div key={i} style={{
                    height: 10, borderRadius: 5,
                    background: 'linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.05) 75%)',
                    backgroundSize: '200% 100%', animation: 'shimDark 1.5s infinite', width: `${w}%`,
                  }}/>
                ))}
              </div>
            )}

            {messages.map((m, i) => {
              if (m.role === 'user') return (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '78%', padding: '8px 12px',
                    background: 'rgba(29,78,216,0.15)',
                    border: '1px solid rgba(29,78,216,0.2)',
                    borderRadius: '12px 3px 12px 12px',
                    fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)',
                  }}>{m.content}</div>
                </div>
              )
              if (m.role === 'error') return (
                <div key={i} style={{ fontSize: 11, color: '#f87171', padding: '6px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                  {m.content}
                </div>
              )
              const html = markedOk ? marked(m.content) : null
              return (
                <div key={i} style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.75)' }}>
                  {html
                    ? <div className="prose-chat-panel" dangerouslySetInnerHTML={{ __html: html }}/>
                    : <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{m.content}</p>
                  }
                </div>
              )
            })}

            {/* Typing indicator */}
            {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingLeft: 2 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', display: 'inline-block',
                    animation: 'typingB 1.2s ease infinite', animationDelay: `${i*0.2}s`,
                  }}/>
                ))}
                <style>{`@keyframes typingB{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}`}</style>
              </div>
            )}

            {/* Quick activity log buttons (when field selected) */}
            {selectedField && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  { label: '☀️ 今日の天気', msg: `「${selectedField.name}」の今日の天気を教えて` },
                  { label: '🌧️ 雨の日', msg: `「${selectedField.name}」で今週雨が降る日はいつ？` },
                  { label: '📅 週間予報', msg: `「${selectedField.name}」の今週の天気予報を教えて` },
                  { label: '🌡️ 気温', msg: `「${selectedField.name}」の今週の最高・最低気温は？` },
                ].map(({ label, msg }) => (
                  <button key={label} onClick={() => send(msg)} style={{
                    padding: '4px 10px', borderRadius: 14,
                    border: '1px solid rgba(29,78,216,0.18)',
                    background: 'rgba(29,78,216,0.06)',
                    color: 'rgba(255,255,255,0.55)', fontSize: 10, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(29,78,216,0.5)'; el.style.color = '#60a5fa'; el.style.background = 'rgba(29,78,216,0.12)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(29,78,216,0.18)'; el.style.color = 'rgba(255,255,255,0.55)'; el.style.background = 'rgba(29,78,216,0.06)' }}
                  >{label}</button>
                ))}
              </div>
            )}

            {/* Quick reply chips */}
            {lastAssistant && !loading && lastAssistant.content.length > 20 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {getSuggestions(lastAssistant.content).map(s => (
                  <button key={s} onClick={() => send(s)} style={{
                    padding: '4px 10px', borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(29,78,216,0.4)'; el.style.color = '#60a5fa' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.color = 'rgba(255,255,255,0.5)' }}
                  >{s}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${loading ? 'rgba(29,78,216,.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '8px 10px 8px 12px',
              transition: 'border-color 0.3s',
            }}>
              <textarea
                ref={textareaRef}
                rows={1} value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyDown={handleKey}
                placeholder={selectedField ? `${selectedField.name}について聞く…` : 'AIに質問する…'}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#f0f0f0', fontSize: 12, lineHeight: 1.5, resize: 'none',
                  caretColor: '#60a5fa', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none', flexShrink: 0,
                  background: loading || !input.trim() ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: loading || !input.trim() ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: !loading && input.trim() ? '0 2px 8px rgba(29,78,216,0.4)' : 'none',
                }}
              >
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                  <path d="M1 6l10-5-4 5 4 5z" fill={loading || !input.trim() ? 'rgba(255,255,255,0.2)' : '#000'}/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .prose-chat-panel h1,.prose-chat-panel h2,.prose-chat-panel h3{color:#fff;font-weight:700;margin:.6em 0 .3em}
        .prose-chat-panel h2{font-size:13px}.prose-chat-panel h3{font-size:12px}
        .prose-chat-panel p{margin:.3em 0;color:rgba(255,255,255,.75);font-size:13px;line-height:1.75}
        .prose-chat-panel ul,.prose-chat-panel ol{padding-left:16px;margin:.3em 0}
        .prose-chat-panel li{color:rgba(255,255,255,.7);font-size:13px;margin:.2em 0;line-height:1.6}
        .prose-chat-panel strong{color:#fff;font-weight:700}
        .prose-chat-panel code{background:rgba(255,255,255,.08);border-radius:4px;padding:1px 5px;font-size:11px;color:#3ecf8e}
      `}</style>
    </div>
  )
}
