"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { getAuthUser, isLoggedIn, logout } from "../lib/auth";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      const userData = getAuthUser();
      
      if (!authenticated || !userData) {
        router.push('/login');
        return;
      }
      
      setUser(userData);
      console.log('Main page: User data:', userData);
      console.log('Main page: User ID:', userData?.id);
      console.log('Main page: User email:', userData?.email);
      
      // For testing with backend, use the created user ID
      if (userData?.id === 'mss2iq') {
        userData.id = '697a50dacc521c70e1012e78';
        console.log('Main page: Updated to backend user ID for testing');
      }
      
      setLoading(false);

      // Check if user just returned from payment success
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      if (paymentSuccess === 'true') {
        console.log('Payment success detected, triggering credit refresh...');
        
        // Trigger multiple credit refresh methods
        setTimeout(() => {
          // Method 1: Global function
          if (typeof window !== 'undefined' && (window as any).refreshCredits) {
            (window as any).refreshCredits();
            console.log('Called global refreshCredits function from main page');
          }
          
          // Method 2: LocalStorage event
          if (typeof window !== 'undefined') {
            localStorage.setItem('credit_refresh', Date.now().toString());
            console.log('Set localStorage credit_refresh event from main page');
            
            // Remove after a short delay to allow event to propagate
            setTimeout(() => {
              localStorage.removeItem('credit_refresh');
            }, 100);
          }
          
          // Method 3: Custom event
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('creditRefresh');
            window.dispatchEvent(event);
            console.log('Dispatched custom creditRefresh event from main page');
          }
          
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        }, 1000);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        onSelectChat={setActiveChat} 
        activeChat={activeChat}
        onChatsUpdate={() => {}}
        userId={user?.id}
        userEmail={user?.email}
        onCreditsChange={setCredits}
      />
      <ChatArea 
        chatId={activeChat} 
        onChatCreated={(id) => setActiveChat(id)}
        userId={user?.id}
        credits={credits}
        onCreditsChange={setCredits}
      />
    </div>
  );
}
