"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import Profile from "../components/Profile";
import { getAuthUser, isLoggedIn, logout } from "../lib/auth";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(1); // Start with 1 credit to allow anonymous chat
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Allow anonymous access - don't require authentication
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      const userData = getAuthUser();
      
      // Set user data if authenticated, otherwise allow anonymous access
      if (authenticated && userData) {
        setUser(userData);
        console.log('Main page: User data:', userData);
        console.log('Main page: User ID:', userData?.id);
        console.log('Main page: User email:', userData?.email);
        
        // For testing with backend, use the created user ID
        if (userData?.id === 'mss2iq') {
          userData.id = '697a50dacc521c70e1012e78';
          console.log('Main page: Updated to backend user ID for testing');
        }
      } else {
        // Allow anonymous access
        console.log('Main page: Allowing anonymous access');
        setUser(null);
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

  const handleNameUpdate = (newName: string) => {
    setUser((prev: any) => prev ? { ...prev, name: newName } : null);
  };

  const handleBuyCredits = () => {
    // This will be passed to Profile component
    if (!user?.id || !user?.email) {
      router.push('/login');
      return;
    }
    
    // Use the same logic as in Sidebar
    import('../services/chatService').then(({ chatService }) => {
      chatService.createCheckoutSession(user.id, user.email).then(({ url }) => {
        if (url) {
          window.location.href = url;
        }
      }).catch((error) => {
        console.error("Failed to create checkout session:", error);
        alert("Failed to start checkout. Please try again.");
      });
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    );
  }

  // Show Profile view
  if (showProfile) {
    return (
      <Profile
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.name}
        credits={credits}
        onBuyCredits={handleBuyCredits}
        onBack={() => setShowProfile(false)}
        onNameUpdate={handleNameUpdate}
      />
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
        onShowProfile={() => setShowProfile(true)}
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
