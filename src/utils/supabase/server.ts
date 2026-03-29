import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase en server actions / route handlers.
 * Tras `await cookies()`, hay que pasar el store de forma **síncrona** a
 * `createServerActionClient`; si devolvés una Promise (p. ej. `() => Promise.resolve(store)`),
 * el adapter llama `.get` sobre la Promise y falla en runtime.
 * Los tipos de Next 15 a veces declaran `cookies()` async; por eso el cast.
 */
export async function createClient () {
  const cookieStore = await cookies()
  return createServerActionClient({
    cookies: () => cookieStore
  } as Parameters<typeof createServerActionClient>[0])
}

