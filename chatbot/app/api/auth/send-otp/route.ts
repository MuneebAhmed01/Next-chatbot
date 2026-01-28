import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, generateOTP } from '@/lib/email';
import { saveOTP } from '@/lib/otp-store';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();
  const limit = rateLimitMap.get(normalizedEmail);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(normalizedEmail, { count: 1, resetAt: now + 60000 }); // 1 minute
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

    const normalizedEmail = email.toLowerCase().trim();

    const checkmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!checkmail.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    
    console.log('=== SEND OTP ===');
    console.log('Email:', normalizedEmail);
    console.log('Generated OTP:', otp);
    
    const sent = await sendOTP(normalizedEmail, otp, purpose);

    if (sent) {
      saveOTP(normalizedEmail, otp, purpose);
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
