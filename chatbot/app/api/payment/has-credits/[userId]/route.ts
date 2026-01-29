import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // For now, return false (no credits)
    // In a real app, this would check database
    return NextResponse.json({
      hasCredits: false
    });
  } catch (error) {
    console.error('Error checking credits:', error);
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}
