import { firebaseAuth } from '@/lib/firebase.admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'GET method is not implemented yet' });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await firebaseAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ message: 'Session cookie set successfully' });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
