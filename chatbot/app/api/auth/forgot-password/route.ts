import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call backend to send password reset OTP
    try {
      const backendRes = await fetch('http://localhost:4000/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await backendRes.json();

      if (backendRes.ok) {
        return NextResponse.json({
          success: true,
          message: 'Password reset instructions sent to your email',
          resetToken: data.resetToken // For development, remove in production
        });
      } else {
        return NextResponse.json(
          { success: false, error: data.message || 'Failed to send reset instructions' },
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
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Password reset request failed' },
      { status: 500 }
    );
  }
}
