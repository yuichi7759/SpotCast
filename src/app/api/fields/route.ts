import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, crop, variety, planted_at, lat, lng, area_m2, notes, color } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Freeプランの登録上限（3件）をサーバー側でも強制
  const { data: urow } = await supabase.from('users').select('plan').eq('id', user.id).single()
  if ((urow?.plan ?? 'free') !== 'pro') {
    const { count } = await supabase
      .from('fields')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Freeプランは3件までです。Standardプランで無制限に登録できます。' },
        { status: 403 },
      )
    }
  }

  const { data, error } = await supabase
    .from('fields')
    .insert({
      user_id: user.id,
      name,
      crop: crop ?? null,
      variety: variety ?? null,
      planted_at: planted_at ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      area_m2: area_m2 ?? null,
      notes: notes ?? null,
      color: color ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
