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
  const [credits, setCredits] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {

    const checkAuth = () => {
      const authenticated = isLoggedIn();
      const userData = getAuthUser();

      if (authenticated && userData) {
        setUser(userData);
        console.log('Main page: User data:', userData);
        console.log('Main page: User ID:', userData?.id);
        console.log('Main page: User email:', userData?.email);


        if (userData?.id === 'mss2iq') {
          userData.id = '697a50dacc521c70e1012e78';
          console.log('Main page: Updated to backend user ID for testing');
        }
      } else {

        console.log('Main page: Allowing anonymous access');
        setUser(null);
      }

      setLoading(false);


      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      if (paymentSuccess === 'true') {
        console.log('Payment success detected, triggering credit refresh...');


        setTimeout(() => {

          if (typeof window !== 'undefined' && (window as any).refreshCredits) {
            (window as any).refreshCredits();

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
            console.log('Dispatched custom creditRefresh event from main page');
          }


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

    if (!user?.id || !user?.email) {
      router.push('/login');
      return;
    }

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



  return (
    <div className="flex h-screen ">
      <Sidebar
        onSelectChat={setActiveChat}
        activeChat={activeChat}
        onChatsUpdate={() => { }}
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

      {showProfile && (
        <Profile
          userId={user?.id}
          userEmail={user?.email}
          userName={user?.name}
          credits={credits}
          onBuyCredits={handleBuyCredits}
          onBack={() => setShowProfile(false)}
          onNameUpdate={handleNameUpdate}
        />
      )}
    </div>
  );
}
