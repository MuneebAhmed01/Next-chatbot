import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return empty chat list
    // In a real app, this would fetch from database
    return NextResponse.json({
      data: []
    });
  } catch (error) {
    console.error('Error fetching sidebar chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
