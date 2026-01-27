"use client";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <Sidebar 
        onSelectChat={setActiveChat} 
        activeChat={activeChat}
        onChatsUpdate={() => {}}
      />
      <ChatArea 
        chatId={activeChat} 
        onChatCreated={(id) => setActiveChat(id)}
      />
    </div>
  );
}
