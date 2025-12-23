import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET () {
  const cookieStore = cookies() // 🔹 Obtiene las cookies de forma segura
  const supabase = createServerActionClient({ cookies: () => cookieStore }) // 🔹 Usa `createServerActionClient`

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
