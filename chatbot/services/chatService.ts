const API_BASE = 'http://localhost:4000/chat';

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
  async getSidebarChats(): Promise<SidebarItem[]> {
    const res = await fetch(`${API_BASE}/sidebar`);
    const data = await res.json();
    return data.data;
  },

  async getChatById(id: string): Promise<ChatThread> {
    const res = await fetch(`${API_BASE}/${id}`);
    const data = await res.json();
    return data.data;
  },

  async sendMessage(message: string, chatId?: string): Promise<{ chat: ChatThread; response: ChatMessage }> {
    const res = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatId }),
    });
    const data = await res.json();
    return data.data;
  },

  async deleteChat(id: string): Promise<void> {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  },

  async getUsage(): Promise<{ messagesUsed: number; messagesLimit: number; plan: string }> {
    const res = await fetch(`${API_BASE}/usage`);
    const data = await res.json();
    return data.data;
  },
};
