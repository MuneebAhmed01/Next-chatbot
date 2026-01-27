import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, otp } = await request.json();

    //chk if fields are filled or not?
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

    if (otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

  //verify otp is entered is corr or not
    const isValidOTP = verifyOTP(email, otp, 'register');

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }
  //  after connecting to db,need to do ts
    // TODO: Hash password and save user to database
    // const hashedPassword = await bcrypt.hash(password, 10);
    // await db.user.create({ email, password: hashedPassword, name });

    // Create authenticated response
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { email, name },
    });

    // Set auth cookies
    response.cookies.set('auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    response.cookies.set('user', JSON.stringify({ email, name }), {
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
