import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET () {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('business_types')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
