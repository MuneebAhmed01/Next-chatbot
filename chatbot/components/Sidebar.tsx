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
  onShowProfile?: () => void;
};

export default function Sidebar({ onSelectChat, activeChat, onChatsUpdate, userId, userEmail, onCreditsChange, onShowProfile }: SidebarProps) {
  const [chats, setChats] = useState<SidebarItem[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
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
      const data = await chatService.getSidebarChats(userId);
      setChats(data || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setChats([]);
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
    setDeleteConfirm(id);
  }

  async function confirmDeleteChat(id: string) {
    try {
      await chatService.deleteChat(id, userId);
      await loadChats();
      if (activeChat === id) {
        onSelectChat(null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setDeleteConfirm(null);
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
    setLogoutConfirm(true);
    requestAnimationFrame(() => {
      setIsLogoutVisible(true);
    });
  }

  function handleLogoutClose() {
    setIsLogoutVisible(false);
    setTimeout(() => {
      setLogoutConfirm(false);
    }, 200);
  }

  function confirmLogout() {
    setIsLogoutVisible(false);
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  }

  return (
    <div className="flex h-screen w-[17%] min-w-[17%] shrink-0 flex-col bg-black">

      {/* Logo Section */}
      <div className='text-white font-bold text-2xl p-4'>Chat<span className='text-purple-500'> BOT</span></div>

      {/* Sidebar */}
      <aside className="flex-1 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-4 flex justify-between items-center shrink-0">
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
          {(!chats || chats.length === 0) && (
            <p className="text-gray-500 text-sm p-4">No chats yet</p>
          )}

          {chats && chats.map((chat) => (
            <div key={chat.id}>
              <div
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
              
              {/* Delete chat */}
              {deleteConfirm === chat.id && (
                <div className="px-4 py-2 bg-gray-800 border-l-4 border-red-500">
                  <p className="text-white text-sm mb-2">Delete this chat?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDeleteChat(chat.id)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Bottom buttons */}
      <div className="p-3 space-y-2">
        {/* profile Button */}
        {userEmail ? (
          <button
            onClick={() => onShowProfile?.()}
            className="w-full text-left px-3 py-3 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-all duration-300 font-medium"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/profile-icon.png" alt="Profile" className="w-4 h-4" />
                <span>My Profile</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="w-full text-left px-3 py-2 text-sm bg-gray-800 text-white hover:bg-gray-700 rounded-xl"
          >
             Sign in
          </button>
        )}

        {/* logout */}
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-white bg-gray-800 hover:bg-gray-700 rounded-xl"
        >
           Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {logoutConfirm && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-200 ease-out ${isLogoutVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}
          onClick={handleLogoutClose}
        >
          <div
            className={`bg-gray-800 rounded-xl p-6 max-w-sm mx-4 border border-gray-700 transition-all duration-200 ease-out ${isLogoutVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-semibold mb-3">Confirm Logout</h3>
            <p className="text-gray-300 text-sm mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleLogoutClose}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
