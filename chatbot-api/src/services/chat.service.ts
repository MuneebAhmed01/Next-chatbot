import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { chatThreads, userUsage, ChatThread, ChatMessage } from '../data/chat.data';
import { SendMessageDto, SaveChatDto, ChatSidebarItemDto } from '../dto/chat.dto';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { PaymentService } from './payment.service';

@Injectable()
export class ChatService {
  private chats: ChatThread[] = [...chatThreads];
  private usage = { ...userUsage };

  constructor(private readonly paymentService: PaymentService) { }

  // Sidebar items
  getSidebarChats(): ChatSidebarItemDto[] {
    return this.chats
      .map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Full chat history
  getChatHistory(): ChatThread[] {
    return this.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Specific chat by id
  getChatById(id: string): ChatThread {
    const chat = this.chats.find(c => c.id === id);
    if (!chat) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }
    return chat;
  }

  // Get OpenRouter response
  async getOpenRouterResponse(prompt: string): Promise<string> {
    const apiKey = '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';
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    const body = {
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  // Send message and get AI response
  async sendMessage(dto: SendMessageDto): Promise<{ chat: ChatThread; response: ChatMessage; credits?: number }> {
    // Check credits if userId is provided
    if (dto.userId) {
      const hasCredits = await this.paymentService.hasCredits(dto.userId);
      if (!hasCredits) {
        throw new BadRequestException('No credits available. Please purchase more credits to continue.');
      }
    }

    let chat: ChatThread | undefined;

    if (dto.chatId) {
      chat = this.chats.find(c => c.id === dto.chatId);
      if (!chat) {
        throw new NotFoundException(`Chat with id ${dto.chatId} not found`);
      }
    } else {
      // Create new chat
      chat = {
        id: `chat-${uuidv4()}`,
        title: dto.message.slice(0, 30) + (dto.message.length > 30 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      this.chats.push(chat);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${uuidv4()}`,
      role: 'user',
      content: dto.message,
      timestamp: new Date().toISOString(),
    };
    chat.messages.push(userMessage);

    // Generate AI response using OpenRouter
    let aiContent = '';
    try {
      aiContent = await this.getOpenRouterResponse(dto.message);
    } catch (err) {
      aiContent = 'Sorry, there was an error generating a response.';
    }

    const aiResponse: ChatMessage = {
      id: `msg-${uuidv4()}`,
      role: 'assistant',
      content: aiContent,
      timestamp: new Date().toISOString(),
    };
    chat.messages.push(aiResponse);
    chat.updatedAt = new Date().toISOString();

    // Deduct credit if userId is provided
    let remainingCredits: number | undefined;
    if (dto.userId) {
      const result = await this.paymentService.deductCredit(dto.userId);
      remainingCredits = result.credits;
    }

    // Update in-memory usage (for backward compatibility)
    this.usage.messagesUsed += 1;

    return { chat, response: aiResponse, credits: remainingCredits };
  }

  // Save/update chat
  saveChat(dto: SaveChatDto): ChatThread {
    const chat = this.chats.find(c => c.id === dto.chatId);
    if (!chat) {
      throw new NotFoundException(`Chat with id ${dto.chatId} not found`);
    }

    if (dto.title) {
      chat.title = dto.title;
    }
    chat.updatedAt = new Date().toISOString();

    return chat;
  }

  // Delete chat history
  deleteChatHistory(): { deleted: number } {
    const count = this.chats.length;
    this.chats = [];
    return { deleted: count };
  }

  // Delete specific chat
  deleteChat(id: string): { deleted: boolean } {
    const index = this.chats.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }
    this.chats.splice(index, 1);
    return { deleted: true };
  }

  // Get usage stats
  getUsage(): typeof userUsage {
    return {
      ...this.usage,
      messagesLimit: this.usage.plan === 'free' ? 100 : 1000,
    };
  }
}
