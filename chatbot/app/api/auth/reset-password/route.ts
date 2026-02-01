import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    console.log('=== FRONTEND RESET PASSWORD DEBUG ===');
    console.log('Request body:', body);

    if (!email || !otp || !newPassword) {
      console.log('Missing required fields:', { email: !!email, otp: !!otp, newPassword: !!newPassword });
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Call backend to reset password
    try {
      console.log('Calling backend:', 'http://localhost:4000/user/reset-password');
      console.log('Sending:', { email, otp, newPassword });
      
      const backendRes = await fetch('http://localhost:4000/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      console.log('Backend response status:', backendRes.status);
      const data = await backendRes.json();
      console.log('Backend response data:', data);

      if (backendRes.ok) {
        return NextResponse.json({
          success: true,
          message: 'Password reset successful',
        });
      } else {
        return NextResponse.json(
          { success: false, error: data.message || 'Failed to reset password' },
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
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Password reset failed' },
      { status: 500 }
    );
  }
}
