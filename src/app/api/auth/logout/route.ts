import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create response and clear the auth cookie
    const response = NextResponse.json({
      message: 'लॉगआउट सफल'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'लॉगआउट करते समय त्रुटि हुई' },
      { status: 500 }
    );
  }
}