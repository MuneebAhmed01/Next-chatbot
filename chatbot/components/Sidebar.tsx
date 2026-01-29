"use client";
import { useState, useEffect } from "react";
import { redirect, useRouter } from 'next/navigation';
import { chatService, SidebarItem } from "../services/chatService";

type SidebarProps = {
  onSelectChat: (id: string | null) => void;
  activeChat: string | null;
  onChatsUpdate?: () => void;
  userId?: string;
  userEmail?: string;
  onCreditsChange?: (credits: number) => void;
};

export default function Sidebar({ onSelectChat, activeChat, onChatsUpdate, userId, userEmail, onCreditsChange }: SidebarProps) {
  const [chats, setChats] = useState<SidebarItem[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  console.log('Sidebar: Received userId:', userId);
  console.log('Sidebar: Received userEmail:', userEmail);

  useEffect(() => {
    loadChats();
    if (userId) {
      loadCredits();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      loadCredits();
    }, 10000); 
    return () => clearInterval(interval);
  }, [userId]);

  
  useEffect(() => {
    const handleCreditRefresh = () => {
      if (userId) {
        console.log('Credit refresh event received, reloading credits...');
        loadCredits();
      }
    };

    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credit_refresh') {
        handleCreditRefresh();
      }
    };

    
    const handleCustomEvent = () => {
      handleCreditRefresh();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('creditRefresh', handleCustomEvent);

    if (typeof window !== 'undefined') {
      (window as any).refreshCredits = handleCreditRefresh;
    }

   
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('creditRefresh', handleCustomEvent);
      if (typeof window !== 'undefined') {
        delete (window as any).refreshCredits;
      }
    };
  }, [userId]);

  async function loadChats() {
    try {
      const data = await chatService.getSidebarChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  }

  async function loadCredits() {
    if (!userId) {
      console.log('loadCredits: No userId provided');
      return;
    }
    
    console.log(`loadCredits: Loading credits for userId: ${userId}`);
    try {
      const data = await chatService.getCredits(userId);
      console.log(`loadCredits: Received data:`, data);
      setCredits(data.credits);
      console.log(`loadCredits: Set credits to: ${data.credits}`);
      if (onCreditsChange) {
        onCreditsChange(data.credits);
        console.log(`loadCredits: Called onCreditsChange with: ${data.credits}`);
      }
    } catch (error) {
      console.error("Failed to load credits:", error);
      setCredits(0);
    }
  }

  useEffect(() => {
    (window as any).refreshCredits = loadCredits;
    (window as any).refreshSidebarChats = loadChats;
  }, [userId]);

  function createNewChat() {
    onSelectChat(null); 
  }

  async function handleDeleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await chatService.deleteChat(id);
      await loadChats();
      if (activeChat === id) {
        onSelectChat(null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  }

  async function handleBuyCredits() {
    if (!userId || !userEmail) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { url } = await chatService.createCheckoutSession(userId, userEmail);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  }

  return (
    <div className="flex h-screen w-[17%] min-w-[17%] shrink-0 flex-col bg-black">

      {/* Logo Section */}
      <div className='text-white font-bold text-2xl p-4'>Chat<span className='text-blue-500'> BOT</span></div>

      {/* Sidebar */}
      <aside className="flex-1 overflow-hidden border-r flex flex-col">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h2 className="font-semibold text-lg text-white">Chats</h2>
          <button
            onClick={createNewChat}
            className="px-3 py-1 rounded bg-gray-800 text-white text-sm hover:bg-gray-700"
          >
            + New
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-gray-500 text-sm p-4">No chats yet</p>
          )}

          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left px-4 py-3 text-sm transition cursor-pointer flex justify-between items-center group
                ${chat.id === activeChat
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800"
                }`}
            >
              <span className="truncate flex-1">{chat.title}</span>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Bottom buttons */}
      <div className="border-t border-gray-700 p-3 space-y-2">
        {/* Available Credits */}
        <div className="flex items-center justify-between px-3 py-2 border border-gray-600 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center gap-2">
           
            <span className="text-sm font-medium text-white">
              Credits: <span className={credits > 0 ? "text-green-400" : "text-red-400"}>{credits}</span>
            </span>
          </div>
          <button
            onClick={handleBuyCredits}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
          >
            {isLoading ? "..." : "Buy more"}
          </button>
        </div>

        {/* Profile */}
        {userEmail ? (
          <div className="w-full text-left px-3 py-2 text-sm bg-black text-white border border-gray-600 rounded-xl">
            <div className="flex items-center justify-between">
              <span> {userEmail}</span>
              <span className="text-xs text-green-400">✓</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="w-full text-left px-3 py-2 text-sm bg-black text-white hover:bg-gray-800 border border-gray-600 rounded-xl"
          >
             Sign in
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-white bg-black hover:bg-gray-800 border border-gray-600 rounded-xl"
        >
           Logout
        </button>
      </div>
    </div>
  );
}
