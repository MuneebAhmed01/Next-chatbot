import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { SendMessageDto, SaveChatDto } from '../zod-schemas/chat.schema';
import { OpenRouterService } from './openrouter.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  
  constructor(
    @InjectModel('Chat') private chatModel: Model<any>,
    @InjectModel('Message') private messageModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    private openRouterService: OpenRouterService,
    private paymentService: PaymentService
  ) {}

  async getSidebarChats(userId?: string) {
    try {
      if (!userId) {
        // Return empty array for unauthenticated users
        return [];
      }

      const chats = await this.chatModel
        .find({ userId })
        .sort({ updatedAt: -1 })
        .select('_id title updatedAt')
        .lean();

      return chats.map(chat => ({
        id: chat._id.toString(),
        title: chat.title,
        updatedAt: chat.updatedAt.toISOString()
      }));
    } catch (error) {
      this.logger.error(`Error fetching sidebar chats: ${error.message}`);
      return [];
    }
  }

  async getChatHistory(userId?: string) {
    try {
      if (!userId) {
        return { chats: [], totalMessages: 0 };
      }

      const chats = await this.chatModel
        .find({ userId })
        .populate('messages')
        .sort({ updatedAt: -1 })
        .lean();

      const totalMessages = chats.reduce((total, chat) => total + (chat.messages?.length || 0), 0);

      return {
        chats: chats.map(chat => ({
          id: chat._id.toString(),
          title: chat.title,
          messages: chat.messages?.map(msg => ({
            id: msg._id.toString(),
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
            model: msg.model
          })) || [],
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString()
        })),
        totalMessages
      };
    } catch (error) {
      this.logger.error(`Error fetching chat history: ${error.message}`);
      return { chats: [], totalMessages: 0 };
    }
  }

  async getUsage(userId?: string) {
    try {
      if (!userId) {
        return { totalChats: 0, totalMessages: 0, creditsUsed: 0 };
      }

      const user = await this.userModel.findById(userId).select('credits');
      const chats = await this.chatModel.find({ userId }).select('_id');
      const messages = await this.messageModel.find({ chatId: { $in: chats.map(c => c._id) } });

      return {
        totalChats: chats.length,
        totalMessages: messages.length,
        creditsUsed: user?.credits || 0
      };
    } catch (error) {
      this.logger.error(`Error fetching usage: ${error.message}`);
      return { totalChats: 0, totalMessages: 0, creditsUsed: 0 };
    }
  }

  async getChatById(id: string, userId?: string) {
    try {
      // For anonymous users or when userId is not provided, fetch chat without userId filter
      const chat = userId 
        ? await this.chatModel
            .findOne({ _id: id, userId })
            .populate('messages')
            .lean()
        : await this.chatModel
            .findOne({ _id: id })
            .populate('messages')
            .lean();

      if (!chat) {
        throw new Error('Chat not found');
      }

      return {
        id: chat._id.toString(),
        title: chat.title,
        messages: chat.messages?.map(msg => ({
          id: msg._id.toString(),
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
          model: msg.model
        })) || [],
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString()
      };
    } catch (error) {
      this.logger.error(`Error fetching chat by ID: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(dto: SendMessageDto) {
    try {
      if (!this.openRouterService.isConfigured()) {
        throw new Error('OpenRouter service is not configured. Please check your API key.');
      }

      // Check if user has credits (if userId is provided)
      if (dto.userId) {
        const hasCredits = await this.paymentService.hasCredits(dto.userId);
        if (!hasCredits) {
          throw new Error('Insufficient credits. Please purchase more credits to continue chatting.');
        }
      }

      // Get or create chat
      let chatId = dto.chatId;
      if (!chatId) {
        // Create new chat
        const newChat = await this.chatModel.create({
          title: this.generateChatTitle(dto.message || ''),
          userId: dto.userId || null,
          messages: []
        });
        chatId = newChat._id.toString();
        this.logger.log(`Created new chat: ${chatId}`);
      }

      // Prepare messages for OpenRouter API
      const modelToUse = dto.model && dto.model !== null ? dto.model : 'openai/gpt-3.5-turbo';
      
      // Get conversation history if chatId exists
      let conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      
      if (chatId) {
        const existingChat = await this.chatModel
          .findById(chatId)
          .populate('messages')
          .lean();
        
        if (existingChat && existingChat.messages) {
          conversationHistory = existingChat.messages.map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));
        }
      }
      
      // Build messages array with system prompt, conversation history, and new message
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system' as const,
          content: 'You are a helpful AI assistant. Please provide thoughtful and accurate responses. Remember the context of our conversation and refer back to previous messages when relevant.'
        },
        ...conversationHistory,
        {
          role: 'user' as const,
          content: dto.message || ''
        }
      ];

      // Call OpenRouter API
      const response = await this.openRouterService.sendMessage({
        model: modelToUse,
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      // Extract the AI response
      const aiMessage = response.choices[0]?.message?.content;
      
      if (!aiMessage) {
        throw new Error('No response received from AI service');
      }

      // Save messages to database
      await this.saveMessageToDatabase(chatId, dto.message, 'user', modelToUse);
      await this.saveMessageToDatabase(chatId, aiMessage, 'assistant', modelToUse);

      // Update chat title if it's the first exchange
      await this.updateChatTitleIfNeeded(chatId, dto.message, aiMessage);

      // Deduct credit if userId is provided
      let creditsRemaining = 0;
      if (dto.userId) {
        const deductionResult = await this.paymentService.deductCredit(dto.userId);
        if (deductionResult.success) {
          creditsRemaining = deductionResult.credits;
          this.logger.log(`Deducted 1 credit from user ${dto.userId}. Remaining: ${creditsRemaining}`);
        } else {
          throw new Error('Failed to deduct credit. Please try again.');
        }
      }

      // Get the updated chat with messages
      const updatedChat = await this.chatModel
        .findById(chatId)
        .populate('messages')
        .lean();

      const chatMessages = updatedChat?.messages?.map(msg => ({
        id: msg._id.toString(),
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        model: msg.model
      })) || [];

      return {
        chat: {
          id: chatId,
          title: updatedChat?.title || this.generateChatTitle(dto.message || ''),
          messages: chatMessages,
          createdAt: updatedChat?.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: updatedChat?.updatedAt?.toISOString() || new Date().toISOString()
        },
        response: {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: aiMessage,
          timestamp: new Date().toISOString()
        },
        credits: creditsRemaining
      };
      
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  private generateChatTitle(firstMessage: string): string {
    // Generate a title from the first message (truncate to reasonable length)
    const title = firstMessage.substring(0, 50);
    return title.length < firstMessage.length ? title + '...' : title;
  }

  private async updateChatTitleIfNeeded(chatId: string, userMessage: string | null | undefined, aiMessage: string): Promise<void> {
    try {
      // Only update title if chat is new (has fewer than 2 messages)
      const messageCount = await this.messageModel.countDocuments({ chatId });
      if (messageCount <= 2) {
        const title = this.generateChatTitle(userMessage || 'Untitled Chat');
        await this.chatModel.findByIdAndUpdate(chatId, { 
          title,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      this.logger.error(`Error updating chat title: ${error.message}`);
      // Don't throw error here, just log it
    }
  }

  private async saveMessageToDatabase(chatId: string, content: string | null | undefined, role: string, model?: string): Promise<void> {
    try {
      const message = await this.messageModel.create({
        chatId,
        content: content || 'No content provided',
        role,
        model: model || 'openai/gpt-3.5-turbo'
      });

      // Add message to chat
      await this.chatModel.findByIdAndUpdate(chatId, {
        $push: { messages: message._id },
        updatedAt: new Date()
      });

      this.logger.log(`Saved ${role} message to chat ${chatId}: ${(content || '').substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(`Error saving message to database: ${error.message}`);
      throw new Error('Failed to save message');
    }
  }

  async saveChat(dto: SaveChatDto) {
    try {
      const chat = await this.chatModel.findByIdAndUpdate(
        dto.chatId,
        { 
          title: dto.title || 'Untitled Chat',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!chat) {
        throw new Error('Chat not found');
      }

      return {
        id: dto.chatId,
        title: dto.title || 'Untitled Chat',
        saved: true
      };
    } catch (error) {
      this.logger.error(`Error saving chat: ${error.message}`);
      throw error;
    }
  }

  async deleteChatHistory(userId?: string) {
    try {
      if (userId) {
        // Delete all chats for this user
        await this.chatModel.deleteMany({ userId });
        await this.messageModel.deleteMany({ 
          chatId: { $in: await this.chatModel.find({ userId }).select('_id') }
        });
      } else {
        // Delete all chats (admin operation)
        await this.chatModel.deleteMany({});
        await this.messageModel.deleteMany({});
      }
      
      return { deleted: true };
    } catch (error) {
      this.logger.error(`Error deleting chat history: ${error.message}`);
      throw error;
    }
  }

  async deleteChat(id: string, userId?: string) {
    try {
      const query = userId ? { _id: id, userId } : { _id: id };
      const chat = await this.chatModel.findOneAndDelete(query);
      
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Delete associated messages
      await this.messageModel.deleteMany({ chatId: id });
      
      return { deleted: true, id };
    } catch (error) {
      this.logger.error(`Error deleting chat: ${error.message}`);
      throw error;
    }
  }
}
