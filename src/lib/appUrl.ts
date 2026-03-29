/** URL base pública de la app (enlaces en correos, invitaciones, etc.). Solo servidor o build. */
export function getAppBaseUrl (): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (explicit) return explicit
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
