import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose, name, password } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose required' }, { status: 400 });
    }

    if (purpose === 'register') {
      if (!name || !password) {
    
        return NextResponse.json({ error: 'Name and password required for registration' }, { status: 400 });
      }

      try {
        const backendRes = await fetch('http://localhost:4000/user/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await backendRes.json();

        if (backendRes.ok) {
          return NextResponse.json({ success: true, message: 'OTP sent successfully' });
        } else {
          return NextResponse.json({ error: data.message || 'Failed to send OTP' }, { status: 400 });
        }
      } catch (err) {
        console.error('Backend connection error:', err);
        return NextResponse.json({ error: 'Failed to connect to authentication service' }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Only registration is supported at this time' }, { status: 400 });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
