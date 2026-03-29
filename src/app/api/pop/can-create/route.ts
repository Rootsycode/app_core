import { NextResponse } from 'next/server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuthenticatedUser } from '@/lib/authHelpers'

export async function GET() {
  try {
    const user = await requireAuthenticatedUser()
    const cookieStore = await cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.rpc('can_user_create_pop', {
      user_id: user.uid
    })

    if (error) {
      return NextResponse.json(
        { canCreate: false, reason: 'Error al verificar límite de POPs' },
        { status: 200 }
      )
    }

    if (!data) {
      const { data: userPops } = await supabase
        .from('pops')
        .select('id')
        .eq('owner_user_id', user.uid)

      if (userPops && userPops.length >= 1) {
        return NextResponse.json({
          canCreate: false,
          reason: 'Ya tienes un POP activo. Solo puedes tener 1 POP por cuenta.'
        })
      }
    }

    return NextResponse.json({ canCreate: data === true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('authenticated') || msg.includes('session')) {
      return NextResponse.json(
        { canCreate: false, reason: 'Debes iniciar sesión para crear un POP' },
        { status: 200 }
      )
    }
    return NextResponse.json(
      { canCreate: false, reason: 'Error al verificar límite de POPs' },
      { status: 200 }
    )
  }
}

