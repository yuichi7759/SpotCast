import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

export const runtime = 'nodejs'

async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-3', input: [text] }),
  })
  const data = await res.json()
  if (!data.data?.[0]?.embedding) throw new Error('Embedding failed')
  return data.data[0].embedding
}

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + size))
    i += size - overlap
  }
  return chunks
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const text = formData.get('text') as string | null

  let content: string | null = null
  const fileName = file?.name || 'text-input'

  if (text) {
    content = text
  } else if (file) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const parsed = await pdfParse(buffer)
      content = parsed.text
    } else {
      content = await file.text()
    }
  }

  if (!content?.trim()) return NextResponse.json({ error: 'No content' }, { status: 400 })

  try {
    const chunks = chunkText(content)
    for (const chunk of chunks) {
      const embedding = await embed(chunk)
      await supabase.from('documents').insert({
        content: chunk,
        embedding,
        metadata: { source: fileName, user_id: user.id },
        user_id: user.id,
      })
    }
    return NextResponse.json({ ok: true, chunks: chunks.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
