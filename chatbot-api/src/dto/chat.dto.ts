import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  chatId?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SaveChatDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class ChatSidebarItemDto {
  id: string;
  title: string;
  updatedAt: Date;
}

export class ChatResponseDto {
  success: boolean;
  data?: any;
  message?: string;
}
