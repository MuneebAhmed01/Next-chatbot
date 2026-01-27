import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, generateOTP } from '@/lib/email';
import { saveOTP } from '@/lib/otp-store';

// Simple rate limiting (store in memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(email);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + 60000 }); // 1 minute
    return true;
  }

  if (limit.count >= 3) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose required' }, { status: 400 });
    }

    if (!['reset', 'register'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const sent = await sendOTP(email, otp, purpose);

    if (sent) {
      saveOTP(email, otp, purpose);
      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email. Please check your email address.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
