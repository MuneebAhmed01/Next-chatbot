"use client";
import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage } from "../services/chatService";
// Add import for Message component
import Message from "./Message";

type ChatAreaProps = {
  chatId: string | null;
  onChatCreated: (id: string) => void;
};

export default function ChatArea({ chatId, onChatCreated }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChat(id: string) {
    try {
      const chat = await chatService.getChatById(id);
      setMessages(chat.messages);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await chatService.sendMessage(userMessage, chatId || undefined);

      // Fix: Check if result and result.chat are defined
      if (result && result.chat && Array.isArray(result.chat.messages)) {
        setMessages(result.chat.messages);

        if (!chatId) {
          onChatCreated(result.chat.id);
          // Refresh sidebar
          if ((window as any).refreshSidebarChats) {
            (window as any).refreshSidebarChats();
          }
        }
      } else {
        // Handle error: result.chat is undefined
        console.error("No chat returned from API", result);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, there was an error processing your message.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, there was an error processing your message.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h1 className="text-5xl font-semibold mb-2">Ask Me Anything</h1>
            </div>
          </div>
        ) : (
          // Use Message component for each message
          messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))
        )}
        {loading && (
          <div className="p-4 rounded-lg bg-gray-800 max-w-3xl">
            <div className="text-xs text-gray-400 mb-1">🤖 Assistant</div>
            <div className="text-gray-400">Typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
