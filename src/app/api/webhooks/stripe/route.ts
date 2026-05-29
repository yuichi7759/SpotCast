import { stripe } from '@/lib/stripe'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[webhook] event:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { user_id?: string }; customer?: string }
    const userId = session.metadata?.user_id
    console.log('[webhook] userId:', userId, 'customer:', session.customer)
    if (userId) {
      const { error } = await supabaseAdmin
        .from('users')
        .upsert({ id: userId, plan: 'pro', stripe_customer_id: session.customer })
      console.log('[webhook] upsert error:', error)
    } else {
      console.error('[webhook] no user_id in metadata')
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', sub.customer)
      .limit(1)
    if (users?.[0]) {
      await supabaseAdmin.from('users').update({ plan: 'free' }).eq('id', users[0].id)
    }
  }

  return NextResponse.json({ received: true })
}
