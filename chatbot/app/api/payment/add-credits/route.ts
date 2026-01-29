import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, error: 'User ID and amount are required' },
        { status: 400 }
      );
    }

    // Call backend API to add credits
    const addCreditsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/payment/add-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount
      })
    });

    const result = await addCreditsResponse.json();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: addCreditsResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      credits: result.credits
    });
  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add credits' },
      { status: 500 }
    );
  }
}
