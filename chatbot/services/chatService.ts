const API_BASE = 'http://localhost:4000/chat';
const PAYMENT_API = 'http://localhost:4000/payment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SidebarItem {
  id: string;
  title: string;
  updatedAt: string;
}

export const chatService = {
  async getSidebarChats(userId?: string): Promise<SidebarItem[]> {
    const res = await fetch(`${API_BASE}/sidebar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId || null }),
    });
    const data = await res.json();
    return data.data || [];
  },

  async getChatById(id: string): Promise<ChatThread> {
    const res = await fetch(`${API_BASE}/${id}`);
    const data = await res.json();
    return data.data;
  },

  async sendMessage(chatId: string | null, message: string, userId?: string, model?: string): Promise<{ chat: ChatThread; response: ChatMessage; credits?: number }> {
    console.log('Sending message', { chatId, message, userId, model });
    const res = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message, userId, model }),
    });
    const data = await res.json();
    console.log('Received response', data);
    console.log('Returning data.data', data.data);
    return data.data;
  },

  async saveChat(chatId: string, title?: string): Promise<ChatThread> {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, title }),
    });
    const data = await res.json();
    return data.data;
  },

  async deleteChat(id: string): Promise<{ deleted: boolean }> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return data.data;
  },

  async getUsage(): Promise<{ messagesUsed: number; messagesLimit: number; plan: string }> {
    const res = await fetch(`${API_BASE}/usage`);
    const data = await res.json();
    return data.data;
  },

  // New credit-related methods
  async getCredits(userId: string): Promise<{ credits: number }> {
    console.log(`chatService.getCredits: Fetching credits for userId: ${userId}`);
    const res = await fetch(`${PAYMENT_API}/credits/${userId}`);
    const data = await res.json();
    console.log(`chatService.getCredits: Received response:`, data);
    return data;
  },

  async hasCredits(userId: string): Promise<boolean> {
    const res = await fetch(`${PAYMENT_API}/has-credits/${userId}`);
    const data = await res.json();
    return data.hasCredits;
  },

  async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
    const res = await fetch(`${PAYMENT_API}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });
    const data = await res.json();

    return { url: data.url };
  },
};
