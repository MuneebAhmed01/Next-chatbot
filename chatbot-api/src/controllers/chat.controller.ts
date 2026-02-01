import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ChatService } from "../services/chat.service";
import { OpenRouterService } from "../services/openrouter.service";
import type {
  SendMessageDto,
  SaveChatDto,
  ChatResponseDto,
} from "../zod-schemas/chat.schema";
import {
  sendMessageSchema,
  saveChatSchema,
} from "../zod-schemas/chat.schema";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService, private readonly openRouterService: OpenRouterService) {}

  @Get("models")
async getModels(): Promise<ChatResponseDto> {
  try {
    const data = await this.openRouterService.getModels();
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

@Post("sidebar")
  async getSidebarChats(@Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.getSidebarChats(body.userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get("history")
  async getChatHistory(@Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.getChatHistory(body.userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get("usage")
  async getUsage(@Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.getUsage(body.userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(":id")
  async getChatById(@Param("id") id: string, @Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.getChatById(id, body.userId);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("send")
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.sendMessage(dto);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post("save")
  @HttpCode(HttpStatus.OK)
  async saveChat(@Body(new ZodValidationPipe(saveChatSchema)) dto: SaveChatDto): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.saveChat(dto);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Delete("history")
  async deleteChatHistory(@Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.deleteChatHistory(body.userId);
      return { success: true, data, message: "Chat history deleted" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Delete(":id")
  async deleteChat(@Param("id") id: string, @Body() body: { userId?: string }): Promise<ChatResponseDto> {
    try {
      const data = await this.chatService.deleteChat(id, body.userId);
      return { success: true, data, message: "Chat deleted" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}