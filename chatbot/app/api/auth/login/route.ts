import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest } from '../../../../lib/validation/api-validation';
import { loginSchema } from '../../../../lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const validation = await validateApiRequest(loginSchema, request);
    
    if (!validation.success) {
      return validation.error!;
    }
    
    const { email, password } = validation.data!;

    const normalizedEmail = email.toLowerCase().trim();

    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password
      })
    });

    const result = await loginResponse.json();

    
    if (!loginResponse.ok || !result.user) {
     
      const errorMsg = result?.message || result?.error || 'Invalid email or password';
      console.log("login-error-1", result);
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: loginResponse.status }
      );
    }

    // On successful login
    const response = NextResponse.json({
      success: true,
      message: result.message || 'Login successful',
      user: {
        id: result.user.id || result.user._id,
        email: result.user.email,
        name: result.user.name,
      },
    });

    response.cookies.set('auth', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('user', JSON.stringify({
      id: result.user.id || result.user._id,
      email: result.user.email,
      name: result.user.name,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
