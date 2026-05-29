import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, message } = await req.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: '件名とメッセージは必須です' }, { status: 400 })
  }

  const { error } = await supabase.from('support_messages').insert({
    user_id: user.id,
    email: user.email,
    subject: subject.trim(),
    message: message.trim(),
  })

  if (error) {
    console.error('[support]', error)
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
