import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, email } = await request.json();

        if (!userId || !email) {
            return NextResponse.json(
                { success: false, error: 'User ID and email are required' },
                { status: 400 }
            );
        }

        // Call backend API to create checkout session
        const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/payment/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                email
            })
        });

        const result = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
            return NextResponse.json(
                { success: false, error: result.message || 'Failed to create checkout session' },
                { status: checkoutResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            sessionId: result.sessionId
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
