import { z } from 'zod';

export const sendMessageSchema = z.object({
  chatId: z.string().nullable().optional(),
  message: z.string().min(1, 'Message is required'),
  userId: z.string().nullable().optional(),
  model: z.string().optional().default('openai/gpt-3.5-turbo'),
});

export const saveChatSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  title: z.string().optional(),
});

export const chatSidebarItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.string(),
});

export const chatResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type SaveChatDto = z.infer<typeof saveChatSchema>;
export type ChatSidebarItemDto = z.infer<typeof chatSidebarItemSchema>;
export type ChatResponseDto = z.infer<typeof chatResponseSchema>;
