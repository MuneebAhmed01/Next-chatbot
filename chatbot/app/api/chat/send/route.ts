import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, chatId, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

   
    const responseMessage = {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: `This is a mock response to: "${message}". AI integration coming soon!`,
      timestamp: new Date().toISOString()
    };

    const userMessage = {
      id: (Date.now() - 1).toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          id: chatId || 'new-chat-' + Date.now(),
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [userMessage, responseMessage]
        },
        response: responseMessage,
        credits: 1 
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
