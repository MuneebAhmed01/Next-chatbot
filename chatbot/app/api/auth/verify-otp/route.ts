import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, purpose, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Call backend to verify OTP
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await backendRes.json();

      if (backendRes.ok) {
        return NextResponse.json({
          success: true,
          message: 'OTP verified successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: data.message || 'Invalid OTP' },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error('Backend connection error:', err);
      return NextResponse.json(
        { success: false, error: 'Failed to connect to authentication service' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
