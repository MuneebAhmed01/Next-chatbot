import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  chatId?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  userId?: string;
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
  updatedAt: string;
}

export class ChatResponseDto {
  success: boolean;
  data?: any;
  message?: string;
}
