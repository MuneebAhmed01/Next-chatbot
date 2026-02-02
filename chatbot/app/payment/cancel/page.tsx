"use client";
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen  flex items-center justify-center p-4">
            <div className="bg-zinc-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30 shadow-2xl">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h1>
                <p className="text-gray-400 mb-6">
                    Your payment was cancelled. No charges were made to your account.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/dashboard/chat')}
                        className="w-full py-3 px-6 bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/chat')}
                        className="w-full py-3 px-6 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300"
                    >
                        Return to Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
