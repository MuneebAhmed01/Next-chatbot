import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-store';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, purpose } = await request.json();

    if (!email || !otp || !purpose) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isValid = verifyOTP(email, otp, purpose);

    if (isValid) {
      return NextResponse.json({ success: true, message: 'OTP verified' });
    } else {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
