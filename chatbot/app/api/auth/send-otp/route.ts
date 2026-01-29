import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose, name, password } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose required' }, { status: 400 });
    }

    // Only 'register' is currently supported via the backend signup flow for this route
    if (purpose === 'register') {
      if (!name || !password) {
        // Should hopefully be caught by client validation, but good to check
        return NextResponse.json({ error: 'Name and password required for registration' }, { status: 400 });
      }

      // Call backend to initiate signup (generates OTP and saves temporary user in DB)
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

    // Fallback/Placeholder for other purposes (like reset) if not fully implemented in backend yet
    // or if we want to keep local behavior. For now, we return error to imply strict backend usage.
    return NextResponse.json({ error: 'Only registration is supported at this time' }, { status: 400 });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
