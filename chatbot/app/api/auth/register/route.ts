import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, hasValidOTP } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, otp } = await request.json();

    // Debug logging
    console.log('=== REGISTER DEBUG ===');
    console.log('Email:', email);
    console.log('OTP received:', otp);
    console.log('Has valid OTP in store:', hasValidOTP(email, 'register'));

    // Check if fields are filled
    if (!email || !password || !name || !otp) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Normalize OTP - remove any spaces and ensure it's a string
    const normalizedOTP = String(otp).trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedOTP.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    console.log('Normalized email:', normalizedEmail);
    console.log('Normalized OTP:', normalizedOTP);

    // Verify OTP
    const isValidOTP = verifyOTP(normalizedEmail, normalizedOTP, 'register');
    console.log('OTP verification result:', isValidOTP);

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // TODO: After connecting to db, hash password and save user
    // const hashedPassword = await bcrypt.hash(password, 10);
    // await db.user.create({ email: normalizedEmail, password: hashedPassword, name });

    // Response
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { email: normalizedEmail, name },
    });

    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user', JSON.stringify({ email: normalizedEmail, name }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
