import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function validateApiRequest<T>(schema: z.ZodSchema<T>, request: NextRequest): {
  success: boolean;
  data?: T;
  error?: NextResponse;
} {
  try {
    const body = await request.json();
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        error: NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: errorMessages 
          },
          { status: 400 }
        )
      };
    }
    
    return {
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    };
  }
}
