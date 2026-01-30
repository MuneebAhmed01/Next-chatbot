import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { chatThreads, userUsage, ChatThread, ChatMessage } from '../data/chat.data';
import type { SendMessageDto, SaveChatDto, ChatSidebarItemDto } from '../zod-schemas/chat.schema';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { PaymentService } from './payment.service';

@Injectable()
export class ChatService {
  private chats: ChatThread[] = [...chatThreads];
  private usage = { ...userUsage };

  constructor(private readonly paymentService: PaymentService) { }

  getSidebarChats(): ChatSidebarItemDto[] {
    return this.chats
      .map(chat => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getChatHistory(): ChatThread[] {
    return this.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getChatById(id: string): ChatThread {
    const chat = this.chats.find(c => c.id === id);
    if (!chat) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }
    return chat;
  }

 
  async getOpenRouterResponse(prompt: string, model: string = 'openai/gpt-3.5-turbo', conversationHistory: ChatMessage[] = []): Promise<string> {
    const apiKey = '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';
    console.log("api fetched with context")
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Build messages array with conversation context
    const messages: any[] = [
      { 
        role: 'system', 
        content: 'You are a helpful assistant. Maintain context of the conversation and provide consistent, relevant responses based on previous messages.' 
      }
    ];

    // Add conversation history (last 10 messages to maintain context)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const body = {
      model: model,
      messages: messages,
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

  async sendMessage(dto: SendMessageDto): Promise<{ chat: ChatThread; response: ChatMessage; credits?: number }> {
 
    // Check credits with error handling
    if (dto.userId) {
      try {
        const hasCredits = await this.paymentService.hasCredits(dto.userId);
        if (!hasCredits) {
          throw new BadRequestException('No credits available. Please purchase more credits to continue.');
        }
      } catch (creditError) {
        console.error('Credit check failed, proceeding anyway:', creditError);
        // Continue with the chat even if credit check fails
      }
    }

    let chat: ChatThread | undefined;

    if (dto.chatId) {
      chat = this.chats.find(c => c.id === dto.chatId);
      if (!chat) {
        throw new NotFoundException(`Chat with id ${dto.chatId} not found`);
      }
    } else {
     
      chat = {
        id: `chat-${uuidv4()}`,
        title: dto.message.slice(0, 30) + (dto.message.length > 30 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      this.chats.push(chat);
    }

    const userMessage: ChatMessage = {
      id: `msg-${uuidv4()}`,
      role: 'user',
      content: dto.message,
      timestamp: new Date().toISOString(),
    };
    chat.messages.push(userMessage);

    
    let aiContent = '';
    try {
      // Pass conversation history to maintain context
      aiContent = await this.getOpenRouterResponse(dto.message, dto.model, chat.messages);
       console.log("api fetched with context and respond")
    } catch (err: any) {
      console.error('Model API Error:', err);
      // If the specific model fails, try with default model
      if (dto.model && dto.model !== 'openai/gpt-3.5-turbo') {
        try {
          console.log('Retrying with default model...');
          aiContent = await this.getOpenRouterResponse(dto.message, 'openai/gpt-3.5-turbo', chat.messages);
          console.log('Default model worked');
        } catch (fallbackErr) {
          aiContent = 'Sorry, there was an error generating a response. Please try again.';
          console.log('Even default model failed:', fallbackErr);
        }
      } else {
        aiContent = 'Sorry, there was an error generating a response. Please try again.';
        console.log('Error with default model:', err);
      }
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
      try {
        const result = await this.paymentService.deductCredit(dto.userId);
        remainingCredits = result.credits;
      } catch (deductError) {
        console.error('Credit deduction failed:', deductError);
        // Continue even if deduction fails
      }
    }

    
    this.usage.messagesUsed += 1;

    return { chat, response: aiResponse, credits: remainingCredits };
  }

  
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

  deleteChatHistory(): { deleted: number } {
    const count = this.chats.length;
    this.chats = [];
    return { deleted: count };
  }

  deleteChat(id: string): { deleted: boolean } {
    const index = this.chats.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Chat with id ${id} not found`);
    }
    this.chats.splice(index, 1);
    return { deleted: true };
  }

  getUsage(): typeof userUsage {
    return {
      ...this.usage,
      messagesLimit: this.usage.plan === 'free' ? 100 : 1000,
    };
  }
}
