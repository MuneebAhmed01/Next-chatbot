import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Call backend API to confirm payment
    const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    const result = await confirmResponse.json();

    if (!confirmResponse.ok) {
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to confirm payment' },
        { status: confirmResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      credits: result.credits,
      message: 'Payment confirmed and credits added'
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
