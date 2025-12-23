import { NextResponse } from 'next/server'

export async function POST () {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'strict',
    expires: new Date(0) // Expira inmediatamente
  })
  return response
}
