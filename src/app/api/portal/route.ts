import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Stripe Customer Portal セッションを発行。ユーザーが解約・支払い方法変更・領収書を
// 自分で操作できる。stripe_customer_id は checkout 完了時に webhook が保存済み。
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: row } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
  const customer = row?.stripe_customer_id as string | undefined
  if (!customer) return NextResponse.json({ error: 'No subscription found' }, { status: 400 })

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[portal]', err)
    const msg = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
