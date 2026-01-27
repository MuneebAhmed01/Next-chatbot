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
import {
  SendMessageDto,
  SaveChatDto,
  ChatResponseDto,
} from "../dto/chat.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  
  @Get("sidebar")
  getSidebarChats(): ChatResponseDto {
    const data = this.chatService.getSidebarChats();
    return { success: true, data };
  }

 
  @Get("history")
  getChatHistory(): ChatResponseDto {
    const data = this.chatService.getChatHistory();
    return { success: true, data };
  }

  
  @Get("usage")
  getUsage(): ChatResponseDto {
    const data = this.chatService.getUsage();
    return { success: true, data };
  }


  @Get(":id")
  getChatById(@Param("id") id: string): ChatResponseDto {
    const data = this.chatService.getChatById(id);
    return { success: true, data };
  }

  @Post("send")
  @HttpCode(HttpStatus.OK)
  sendMessage(@Body() dto: SendMessageDto): ChatResponseDto {
    const data = this.chatService.sendMessage(dto);
    return { success: true, data };
  }

  @Post("save")
  @HttpCode(HttpStatus.OK)
  saveChat(@Body() dto: SaveChatDto): ChatResponseDto {
    const data = this.chatService.saveChat(dto);
    return { success: true, data };
  }

  @Delete("history")
  deleteChatHistory(): ChatResponseDto {
    const data = this.chatService.deleteChatHistory();
    return { success: true, data, message: "Chat history deleted" };
  }

  @Delete(":id")
  deleteChat(@Param("id") id: string): ChatResponseDto {
    const data = this.chatService.deleteChat(id);
    return { success: true, data, message: "Chat deleted" };
  }
}