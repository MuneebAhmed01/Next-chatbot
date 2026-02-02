import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, name, password } = await request.json(); // password might be passed but verify endpoint only needs email/otp usually if user is already temp saved

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Call backend to verify OTP and finalize signup
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await backendRes.json();

      if (backendRes.ok) {
        // Verification successful. Backend returns { message, userId }
        const userId = data.userId;

        // Create success response
        const response = NextResponse.json({
          success: true,
          message: 'Registration successful',
          user: { email, name, id: userId },
        });

        // Set Auth Cookie
        response.cookies.set('auth', 'true', {
          httpOnly: false, // Allow client access if needed
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });

        // Set User Cookie (Important: Include ID for Stripe credits!)
        response.cookies.set('user', JSON.stringify({
          email,
          name,
          id: userId
        }), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return response;
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
