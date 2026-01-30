import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { MockUserModel, mockConnect } from '@/lib/mock-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Connect to database
    let UserModel;
    try {
      await connectDB();
      UserModel = User;
    } catch (error) {
      console.log('MongoDB not available, using mock database');
      await mockConnect();
      UserModel = MockUserModel;
    }

    // Find user and get credits
    let user;
    if (UserModel === User) {
      // MongoDB
      user = await UserModel.findById(userId);
    } else {
      // Mock database
      user = await (UserModel as any).findById(userId);
    }

    if (!user) {
      return NextResponse.json({
        credits: 0
      });
    }

    return NextResponse.json({
      credits: user?.credits || 0
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}
