'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant' | 'error'
  content: string
}

// ─── Contextual quick reply chips ────────────────────────────────────────────
function getSuggestions(content: string): string[] {
  if (/雨|降水|傘|濡れ/.test(content))
    return ['今週雨が降る日は？', '週末の天気は？', '雨雲レーダーを見る']
  if (/台風|嵐|暴風|警報/.test(content))
    return ['進路を教えて', '影響はいつまで？', '注意点は？']
  if (/気温|暑い|寒い|最高|最低|体感/.test(content))
    return ['今週の気温推移は？', '週末は何度？', '過ごしやすい日は？']
  if (/風|強風|突風/.test(content))
    return ['風が弱まる時間は？', '明日の風速は？']
  if (/雪|積雪|凍結/.test(content))
    return ['いつ雪が止む？', '積雪量は？', '路面状況は？']
  if (/晴れ|日差し|UV|紫外線/.test(content))
    return ['今週一番晴れる日は？', '日焼け対策は？']
  if (/予報|明日|週末|週間/.test(content))
    return ['7日間予報は？', '14日予報を見る', '時間別予報は？']
  if (/ポイント|登録|場所/.test(content))
    return ['ポイントを登録する →', 'ダッシュボードへ →']
  return ['詳しく教えて', '週間天気は？', '今日の予報を要約して']
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function GlobeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
      stroke={active ? '#3b82f6' : '#555'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <ellipse cx="8" cy="8" rx="2.8" ry="6.5"/>
      <line x1="1.5" y1="6" x2="14.5" y2="6"/>
      <line x1="1.5" y1="10" x2="14.5" y2="10"/>
    </svg>
  )
}
function DbIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
      stroke={active ? '#818cf8' : '#555'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="4" rx="5.5" ry="2"/>
      <path d="M2.5 4v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V4"/>
      <path d="M2.5 7v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V7"/>
    </svg>
  )
}
function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="none"
      stroke={copied ? '#3b82f6' : '#666'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="8" height="9" rx="1.5"/>
      <path d="M3 11H2a1 1 0 01-1-1V2a1 1 0 011-1h7a1 1 0 011 1v1"/>
    </svg>
  )
}

// ─── Quick reply chips ────────────────────────────────────────────────────────
function QuickReplies({ content, onSelect }: { content: string; onSelect: (s: string) => void }) {
  const chips = getSuggestions(content)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {chips.map(s => (
        <button key={s} onClick={() => onSelect(s)} style={{
          padding: '6px 14px', borderRadius: 20,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(29,78,216,0.4)'; el.style.color = '#3b82f6'; el.style.background = 'rgba(29,78,216,0.06)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; el.style.background = 'var(--surface)' }}
        >{s}</button>
      ))}
    </div>
  )
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg, renderMd }: { msg: Message; renderMd: boolean }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  const html = renderMd && msg.role === 'assistant'
    ? (typeof window !== 'undefined' && (window as unknown as { marked?: { parse: (s: string) => string } }).marked)
      ? (window as unknown as { marked: { parse: (s: string) => string } }).marked.parse(msg.content)
      : msg.content
    : null

  if (msg.role === 'error') return (
    <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400">{msg.content}</div>
  )

  if (msg.role === 'user') return (
    <div className="group flex justify-end animate-[fadeUp_.16s_ease]">
      <div className="relative max-w-[72%]">
        <button onClick={copy} className="absolute -left-7 top-1.5 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <CopyIcon copied={copied}/>
        </button>
        <div className="px-4 py-3 text-base leading-[1.7] break-words"
          style={{ background: 'var(--user-bubble)', color: 'var(--user-bubble-text)', borderRadius: '16px 4px 16px 16px' }}>
          {msg.content}
        </div>
      </div>
    </div>
  )

  return (
    <div className="group flex flex-col gap-2 animate-[fadeUp_.16s_ease] w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 text-base leading-[1.9] tracking-[-0.01em]" style={{ color: 'var(--ai-bubble-text)' }}>
          {html
            ? <div className="prose-chat" dangerouslySetInnerHTML={{ __html: html }}/>
            : <p className="whitespace-pre-wrap">{msg.content}</p>
          }
        </div>
        <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" title="コピー">
          <CopyIcon copied={copied}/>
        </button>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex flex-col gap-1">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
        }}>🌤️</div>
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#3b82f6' }}>SpotCast AI</span>
      </div>
      <div className="flex gap-1.5 items-center py-1 pl-1">
        {[0,1,2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full" style={{
            background: '#3b82f6', display: 'inline-block',
            animation: 'typingBounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
        <style>{`@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}`}</style>
      </div>
    </div>
  )
}

// ─── OS Boot screen ───────────────────────────────────────────────────────────
function BootScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, gap: 16, padding: 32,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 15,
        background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
        boxShadow: '0 0 0 8px rgba(29,78,216,0.12), 0 0 0 16px rgba(29,78,216,0.05)',
        animation: 'bootPulse 2s ease-in-out infinite',
      }}>🌤️</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          SpotCast AI 起動中
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          天気ブリーフィングを準備しています…
        </div>
      </div>
      <style>{`@keyframes bootPulse{0%,100%{box-shadow:0 0 0 8px rgba(29,78,216,.12),0 0 0 16px rgba(29,78,216,.05)}50%{box-shadow:0 0 0 14px rgba(29,78,216,.18),0 0 0 24px rgba(29,78,216,.07)}}`}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChatWindow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')
  const fieldName  = searchParams.get('fieldName') ?? ''
  const fieldCrop  = searchParams.get('fieldCrop') ?? ''
  const presetQ    = searchParams.get('q') ?? ''

  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [booting,        setBooting]        = useState(false)   // OS boot state
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [useSearch,      setUseSearch]      = useState(true)
  const [useRag,         setUseRag]         = useState(false)
  const [renderMd,       setRenderMd]       = useState(true)
  const [markedReady,    setMarkedReady]    = useState(false)
  const [fieldBanner,    setFieldBanner]    = useState(!!fieldName)

  const bottomRef     = useRef<HTMLDivElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const skipNextLoad  = useRef(false)
  const hasBooted     = useRef(false)  // Prevent double-boot

  // Load marked.js
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    s.onload = () => setMarkedReady(true)
    document.head.appendChild(s)
  }, [])

  // Pre-fill input from ?q= param
  useEffect(() => {
    if (presetQ && !conversationId) setInput(presetQ)
  }, [presetQ, conversationId])

  // Load conversation history
  useEffect(() => {
    if (!conversationId) { setMessages([]); return }
    if (skipNextLoad.current) { skipNextLoad.current = false; return }
    setLoadingHistory(true)
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant', content: m.content,
          })))
        }
      })
      .finally(() => setLoadingHistory(false))
  }, [conversationId])

  // Auto-boot: AI speaks first when no conversation and not from field/preset
  useEffect(() => {
    if (conversationId) return          // Already in a conversation
    if (fieldName || presetQ) return    // Coming from field context — user has intent
    if (hasBooted.current) return       // Already booted this session
    hasBooted.current = true
    autoBoot()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function autoBoot() {
    setBooting(true)
    try {
      // Create a new conversation titled with today's date
      const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${today}の作業計画` }),
      })
      if (!convRes.ok) { setBooting(false); return }
      const conv = await convRes.json()

      // Navigate to the new conversation (suppress history load)
      skipNextLoad.current = true
      router.push(`/chat?id=${conv.id}`)
      window.dispatchEvent(new CustomEvent('conversation-updated'))

      // Stream daily plan
      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convId: conv.id }),
      })
      if (!res.ok) { setBooting(false); return }

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let accumulated = ''
      setMessages([{ role: 'assistant', content: '' }])
      setBooting(false)
      setLoading(true)

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
              setMessages([{ role: 'assistant', content: accumulated }])
            }
          } catch {}
        }
      }
    } catch {
      setBooting(false)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, booting])

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    if (!overrideText) setInput('')
    if (textareaRef.current && !overrideText) textareaRef.current.style.height = 'auto'
    setLoading(true)

    // Create conversation if needed
    let convId = conversationId
    if (!convId) {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text.slice(0, 40) }),
      })
      if (res.ok) {
        const conv = await res.json()
        convId = conv.id
        skipNextLoad.current = true
        router.push(`/chat?id=${convId}${fieldName ? `&fieldName=${encodeURIComponent(fieldName)}` : ''}`)
        window.dispatchEvent(new CustomEvent('conversation-updated'))
      }
    }

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)

    if (convId) {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: text }),
      })
    }

    const apiMessages = history
      .filter(m => m.role !== 'error')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))

    const fieldContext = fieldName
      ? `【ポイント情報】「${fieldName}」について相談中です。`
      : undefined

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, useSearch, useRag, fieldContext }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed')

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
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              accumulated += parsed.text
              setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: accumulated }])
            }
          } catch {}
        }
      }

      if (convId && accumulated) {
        await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: accumulated }),
        })
        window.dispatchEvent(new CustomEvent('conversation-updated'))
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'error', content: 'エラー: ' + (e instanceof Error ? e.message : 'Unknown') }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, loading, messages, useSearch, useRag, conversationId, router, fieldName, fieldCrop])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); send()
    }
  }

  const btnStyle = (active: boolean, color: 'green' | 'indigo') => ({
    border: active ? `1px solid ${color === 'green' ? '#3b82f6' : '#818cf8'}` : '1px solid var(--border)',
    background: active ? color === 'green' ? 'rgba(29,78,216,.1)' : 'rgba(129,140,248,.1)' : 'transparent',
  })

  // Build Q&A pairs
  const pairs: { user: Message; assistant?: Message }[] = []
  messages.forEach(m => {
    if (m.role === 'user') pairs.push({ user: m })
    else if (m.role === 'assistant' && pairs.length > 0) pairs[pairs.length - 1].assistant = m
    else pairs.push({ user: { role: 'user', content: '' }, assistant: m })
  })

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <style>{`
        @keyframes gradientPulse {
          0%   { opacity: .13; background-position: 0% 50%; }
          50%  { opacity: .22; background-position: 100% 50%; }
          100% { opacity: .13; background-position: 0% 50%; }
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Pulsating gradient while AI responds */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, #3ecf8e 0%, #06b6d4 40%, #6366f1 100%)',
        backgroundSize: '300% 300%',
        animation: (loading || booting) ? 'gradientPulse 3s ease infinite' : 'none',
        opacity: (loading || booting) ? 0.15 : 0,
        transition: 'opacity 0.8s ease',
      }}/>

      {/* Messages area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col gap-10 max-w-3xl w-full mx-auto" style={{ paddingBottom: '1.5rem' }}>

        {/* OS Boot screen */}
        {booting && <BootScreen/>}

        {/* Loading history */}
        {!booting && loadingHistory && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>読み込み中…</span>
          </div>
        )}

        {/* Field context — empty state */}
        {!booting && !loadingHistory && messages.length === 0 && fieldName && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: '0 8px 24px rgba(29,78,216,0.35)',
              }}>📍</div>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{fieldName}</p>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                このポイントの天気についてSpotCast AIがお答えします
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-md mx-auto">
                {[
                  { label: '今日の天気', text: `${fieldName}の今日の天気を教えて` },
                  { label: '週間予報', text: `${fieldName}の今週の天気は？` },
                  { label: '雨の日', text: `${fieldName}で雨が降る日はいつ？` },
                  { label: '週末', text: `${fieldName}の週末の天気は？` },
                ].map(ex => (
                  <button key={ex.text} onClick={() => send(ex.text)}
                    className="text-left px-4 py-3 rounded-xl transition hover:opacity-80"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <span className="text-xs font-semibold text-green-400 block mb-1">{ex.label}</span>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{ex.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {!booting && !loadingHistory && pairs.map((pair, i) => {
          const isLast = i === pairs.length - 1
          return (
            <div key={i} className="flex flex-col gap-3">
              {pair.user.content && <Bubble msg={pair.user} renderMd={false}/>}
              {pair.assistant && <Bubble msg={pair.assistant} renderMd={renderMd && markedReady}/>}
              {isLast && pair.assistant && !loading && pair.assistant.content.length > 20 && (
                <QuickReplies content={pair.assistant.content} onSelect={s => send(s)}/>
              )}
              {loading && isLast && !pair.assistant && <TypingDots/>}
            </div>
          )
        })}

        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="relative z-10 px-3 sm:px-6 pb-5 pt-2 flex-shrink-0">

        {/* Field context banner */}
        {fieldBanner && fieldName && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)' }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
              {fieldName} の天気を相談中
            </span>
            <Link href="/dashboard" style={{ fontSize: 11, color: 'rgba(29,78,216,0.5)', marginLeft: 4, textDecoration: 'none' }}>
              ← ダッシュボード
            </Link>
            <button onClick={() => setFieldBanner(false)} style={{ marginLeft: 'auto', color: 'rgba(29,78,216,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
              ×
            </button>
          </div>
        )}

        <div className="rounded-3xl transition-all flex flex-col max-w-3xl mx-auto" style={{
          border: `1px solid ${loading ? 'rgba(29,78,216,.35)' : 'var(--border)'}`,
          background: 'var(--input-bg)',
          boxShadow: loading ? '0 0 0 3px rgba(29,78,216,.08)' : 'none',
          transition: 'border-color .4s, box-shadow .4s',
        }}>
          <textarea
            ref={textareaRef} rows={1} value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder={fieldName ? `${fieldName}について質問する…` : 'AIに答える、または質問する…'}
            className="w-full px-5 pt-3.5 pb-2 bg-transparent text-base outline-none resize-none leading-[1.6] tracking-[-0.01em]"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--text-primary)' }}
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex gap-1.5">
              <button onClick={() => setUseSearch(v => !v)}
                className="flex items-center justify-center p-2 rounded-xl transition cursor-pointer"
                style={btnStyle(useSearch, 'green')} title="Web検索">
                <GlobeIcon active={useSearch}/>
              </button>
              <button onClick={() => setUseRag(v => !v)}
                className="flex items-center justify-center p-2 rounded-xl transition cursor-pointer"
                style={btnStyle(useRag, 'indigo')} title="RAG検索">
                <DbIcon active={useRag}/>
              </button>
              <button onClick={() => setRenderMd(v => !v)}
                className="text-[10px] font-semibold px-2 py-1.5 rounded-xl transition cursor-pointer tracking-[.03em]"
                style={renderMd
                  ? { border: '1px solid #fbbf24', background: 'rgba(251,191,36,.1)', color: '#fbbf24' }
                  : { border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                title="Markdownレンダリング">
                MD
              </button>
            </div>
            <button onClick={() => send()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-20 transition-all"
              style={{
                background: loading ? '#3b82f6' : 'var(--text-primary)',
                boxShadow: loading ? '0 0 10px rgba(29,78,216,.4)' : 'none',
              }}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                <path d="M1.5 8L14.5 1.5L10 8L14.5 14.5L1.5 8Z" fill="var(--bg)"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
