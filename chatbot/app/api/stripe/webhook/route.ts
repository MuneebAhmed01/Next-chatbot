import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { success: false, error: 'No signature found' },
                { status: 400 }
            );
        }

        let event;

        try {
            
            event = JSON.parse(body);
        } catch (err) {
            console.error('Webhook parsing error:', err);
            return NextResponse.json(
                { success: false, error: 'Webhook parsing failed' },
                { status: 400 }
            );
        }

       
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const sessionId = session.id;

            if (sessionId) {
                
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/payment/confirm`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId }),
                    });

                    if (!response.ok) {
                        console.error('Failed to confirm payment');
                    } else {
                        const result = await response.json();
                        console.log(`Successfully confirmed payment for session: ${sessionId}, credits: ${result.credits}`);
                    }
                } catch (err) {
                    console.error('Error calling backend API:', err);
                }
            }
        }

        return NextResponse.json({ success: true, received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { success: false, error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
