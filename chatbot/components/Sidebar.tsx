"use client";
import { useState } from "react";
import { redirect } from 'next/navigation';

type Chat = {
  id: string;
  title: string;
};

export default function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  function createNewChat() {
    const newChat = {
      id: crypto.randomUUID(),
      title: "New chat",
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
  }

  return (
    <div className="flex h-screen w-[17%] min-w-[17%] shrink-0 flex-col bg-black">

         {/* Logo Section */}
        <div className='text-white font-bold text-2xl'>Chat<span className='text-blue-500'> BOT</span></div>
      
      {/* Sidebar */}
      <aside className="h-[50%] chat border-r text white flex flex-col">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Chats</h2>
          <button
            onClick={createNewChat}
            className="px-3 py-1 rounded bg-black text-white text-sm hover:bg-gray-800"
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
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full text-left px-4 py-3 truncate text-sm transition
                ${
                  chat.id === activeChat
                    ? "bg-gray-200 font-medium"
                    : "hover:bg-gray-100"
                }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </aside>
      {/* Main Chat Area */}
      <main className="flex-1 p-6">
        {activeChat ? (
          <h1 className="text-xl font-semibold">
            Chat: {chats.find((c) => c.id === activeChat)?.title}
          </h1>
        ) : (
          <h1 className="text-gray-500">Select or create a chat</h1>
        )}
      </main>
      {/* 3 button in a column */}
    
<div className="border-t p-3 space-y-2 ">

  {/* Available Credits */}
  <div className="flex items-center justify-between px-3 py-2 border border-white rounded-xl">
    <span className="text-sm font-medium  bg-black text-white ">
      Available credit: 0
    </span>

    <button
      onClick={() => console.log("Buy more")}
      className="text-xs px-0.5 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-800"
    >
      Buy more
    </button>
  </div>

  {/* Profile / Signup / Login */}
  <button
    onClick={() => console.log("Profile or Auth")}
    className="w-full text-left px-3 py-2  text-sm bg-black text-white hover:bg-gray-200 border border-white rounded-xl"
  >
    👤 Your profile / Sign up / Login
  </button>

  {/* Logout */}
  <button
    onClick={() => redirect('/login')}
    className="w-full text-left px-3 py-2  text-sm text-white bg-black hover:bg-red-100 border border-white rounded-xl"
  >
    🚪 Logout
  </button>

</div>


    </div>
  );
}
