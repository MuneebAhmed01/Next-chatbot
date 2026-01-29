"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { removeRequestMeta } from 'next/dist/server/request-meta';

function getOrCreateUserId(): string {
    if (typeof window === 'undefined') return '';
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('user_id', userId);
    }
    return userId;
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [credits, setCredits] = useState<number | null>(null);
    const hasConfirmed = useRef(false); 

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sessionId = searchParams.get('session_id');
        let userId = searchParams.get('user_id');

        
        if (!userId) {
            userId = getOrCreateUserId();
            const url = new URL(window.location.href);
            url.searchParams.set('user_id', userId);
            window.location.replace(url.toString());
            return;
        }

        if (sessionId && userId && !hasConfirmed.current) {
            hasConfirmed.current = true;
            confirmPayment(sessionId, userId);
        } else if (!sessionId || !userId) {
            setStatus('error')
            console.log("userID",userId)
            console.log("sessionID",sessionId)
            console.log("status change:1")
        }
   
    }, []);

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                router.push('/?payment_success=true');
            }, 3000); 

            return () => clearTimeout(timer);
        }
    }, [status, router]);

    async function confirmPayment(sessionId: string, userId: string) {
        try {
         
            const response = await fetch('http://localhost:4000/payment/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits);
                setStatus('success');
            
            
                if (typeof window !== 'undefined' && (window as any).refreshCredits) {
                    (window as any).refreshCredits();
                    console.log('Called global refreshCredits function');
                }
              
                if (typeof window !== 'undefined') {
                    localStorage.setItem('credit_refresh', Date.now().toString());
                    
                    setTimeout(() => {
                        localStorage.removeItem('credit_refresh');
                    }, 100);
                }
                
              
                if (typeof window !== 'undefined') {
                    const event = new CustomEvent('creditRefresh');
                    window.dispatchEvent(event);
                   
                }
            } else {
                setStatus('error')
                console.log("status change:2")
                ;;
            }
        } catch (error) {
            setStatus('error');
            console.log("status change:3")
            console.error('Payment confirmation error:', error);
            console.log('Payment confirmation error:', error);
            console.log("errror from stripe",error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-zinc-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-black shadow-2xl">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4   rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Processing Payment...</h1>
                        <p className="text-gray-400">Please wait while we confirm your payment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20  rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful! </h1>
                        <p className="text-gray-400 mb-4">Your credits have been added to your account.</p>
                        {credits !== null && (
                            <div className="bg-green-500/20 rounded-xl p-4 mb-6">
                                <p className="text-green-400 text-lg font-medium">
                                    You now have <span className="text-2xl font-bold text-green-300">{credits}</span> credits
                                </p>
                            </div>
                        )}
                        <p className="text-gray-500 text-sm mb-6">Redirecting to chat in 3 seconds...</p>
                        <button
                            onClick={() => router.push('/?payment_success=true')}
                            className="w-full py-3 px-6  text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                        >
                            Start Chatting →
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Something Went Wrong</h1>
                        <p className="text-gray-400 mb-6">We couldn't confirm your payment. Please try again or contact support.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 px-6 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300"
                        >
                            Return to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
