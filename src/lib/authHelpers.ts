'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function requireAuthenticatedUser () {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized: No authenticated user')
  }

  return {
    uid: user.id,
    email: user.email
  }
}

export async function getAuthenticatedUserOrNull (): Promise<{
  uid: string
  email: string | undefined
} | null> {
  const cookieStore = await cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return { uid: user.id, email: user.email ?? undefined }
}
