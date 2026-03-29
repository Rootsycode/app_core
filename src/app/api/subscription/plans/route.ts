import { NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('base_price_monthly', { ascending: true })

    if (error) {
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

