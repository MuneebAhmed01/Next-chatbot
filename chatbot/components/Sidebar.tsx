"use client";
import { useState, useEffect } from "react";
import { redirect } from 'next/navigation';
import { chatService, SidebarItem } from "../services/chatService";

type SidebarProps = {
  onSelectChat: (id: string | null) => void;
  activeChat: string | null;
  onChatsUpdate?: () => void;
};

export default function Sidebar({ onSelectChat, activeChat, onChatsUpdate }: SidebarProps) {
  const [chats, setChats] = useState<SidebarItem[]>([]);
  const [credits, setCredits] = useState({ used: 0, limit: 100 });

  useEffect(() => {
    loadChats();
    loadUsage();
  }, []);

  async function loadChats() {
    try {
      const data = await chatService.getSidebarChats();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  }

  async function loadUsage() {
    try {
      const usage = await chatService.getUsage();
      setCredits({ used: usage.messagesUsed, limit: usage.messagesLimit });
    } catch (error) {
      console.error("Failed to load usage:", error);
    }
  }

  function createNewChat() {
    onSelectChat(null); // null means new chat
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

  // Expose refresh function
  useEffect(() => {
    if (onChatsUpdate) {
      (window as any).refreshSidebarChats = loadChats;
    }
  }, [onChatsUpdate]);

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
                ${
                  chat.id === activeChat
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
        <div className="flex items-center justify-between px-3 py-2 border border-gray-600 rounded-xl">
          <span className="text-sm font-medium text-white">
            Credits: {credits.limit - credits.used}/{credits.limit}
          </span>
          <button
            onClick={() => console.log("Buy more")}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
          >
            Buy more
          </button>
        </div>

        {/* Profile */}
        <button
          onClick={() => console.log("Profile or Auth")}
          className="w-full text-left px-3 py-2 text-sm bg-black text-white hover:bg-gray-800 border border-gray-600 rounded-xl"
        >
          👤 Your profile / Sign up / Login
        </button>

        {/* Logout */}
        <button
          onClick={() => redirect('/login')}
          className="w-full text-left px-3 py-2 text-sm text-white bg-black hover:bg-gray-800 border border-gray-600 rounded-xl"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
