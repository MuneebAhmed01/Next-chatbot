import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '../../../../lib/validation/api-validation';
import { registerSchema } from '../../../../lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.purpose === 'register') {
      // Validate the request body directly
      const validation = registerSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: validation.error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            }))
          },
          { status: 400 }
        );
      }
      
      const { name, email, password } = validation.data;

      try {
        const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/signup`, {
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

    return NextResponse.json({ error: 'Only registration is supported at this time' }, { status: 400 });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
