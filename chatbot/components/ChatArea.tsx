"use client";
import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage } from "../services/chatService";
import Message from "./Message";
import ModelSelector from "./ModelSelector";
import ContextIndicator from "./ContextIndicator";
import { DEFAULT_MODEL, type ModelId } from "../lib/models";

type ChatAreaProps = {
  chatId: string | null;
  onChatCreated: (id: string) => void;
  userId?: string;
  credits: number;
  onCreditsChange?: (credits: number) => void;
};

export default function ChatArea({ chatId, onChatCreated, userId, credits, onCreditsChange }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL);
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

    // Check credits before sending
    if (credits <= 0) {
      setError("No credits available. Please purchase more credits to continue chatting.");
      return;
    }

    setError(null);
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
      console.log('ChatArea.handleSend: Calling chatService.sendMessage');
      const result = await chatService.sendMessage(chatId || null, userMessage, userId, selectedModel);
      console.log('ChatArea.handleSend: Received result', result);

      if (result && result.chat && Array.isArray(result.chat.messages)) {
        console.log('ChatArea.handleSend: Setting messages', result.chat.messages);
        setMessages(result.chat.messages);

       
        if (result.credits !== undefined && onCreditsChange) {
          onCreditsChange(result.credits);
        }

        if ((window as any).refreshCredits) {
          (window as any).refreshCredits();
        }

        if (!chatId) {
          onChatCreated(result.chat.id);
         
          if ((window as any).refreshSidebarChats) {
            (window as any).refreshSidebarChats();
          }
        }
      } else {
        console.error("Api error", result);
        
        if (result && result.response) {
         
          setMessages((prev) => [...prev, result.response]);
          
        
          if (result.credits !== undefined && onCreditsChange) {
            onCreditsChange(result.credits);
          }
        } else {
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
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage = error.message || "Sorry, there was an error processing your message.";

      if (errorMessage.includes("No credits")) {
        setError("No credits available. Please purchase more credits to continue chatting.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-900 h-screen">
      {/* No Credits Warning */}
      {credits <= 0 && (
        <div className="bg-linear-to-r from-red-900/80 to-orange-900/80 border-b border-red-500/30 p-4">
          <div className="flex items-center justify-center gap-3">
           
            <div className="text-center">
              <p className="text-white font-semibold">No Credits Available</p>
              <p className="text-red-200 text-sm">Purchase credits to continue chatting</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-500/30 p-3 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h1 className="text-5xl font-semibold mb-2">Ask Me Anything</h1>
              {credits <= 0 && (
                <p className="text-lg text-red-400 mt-4">
                   You need credits to start chatting
                </p>
              )}
              {credits > 0 && (
                <p className="text-lg text-green-400 mt-4">
                   You have {credits} credits available
                </p>
              )}
            </div>
          </div>
        ) : (
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
        <div className="flex gap-3 max-w-4xl mx-auto mb-3">
          <ContextIndicator messageCount={messages.length} maxContext={10} />
        </div>
        <div className="flex gap-3 max-w-4xl mx-auto">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={loading || credits <= 0}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={credits <= 0 ? "Purchase credits to chat..." : "Send a message..."}
            disabled={loading || credits <= 0}
            className={`flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border focus:outline-none focus:border-blue-500 ${credits <= 0
                ? "border-red-500/50 cursor-not-allowed opacity-50"
                : "border-gray-600"
              }`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || credits <= 0}
            className={`px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${credits <= 0
                ? "bg-gray-600"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
