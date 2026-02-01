import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenRouterService } from './openrouter.service';
import { PaymentService } from '../payment/payment.service';
import Chat from '../models/chat.model';
import Message from '../models/message.model';
import User from '../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Chat', schema: Chat.schema },
      { name: 'Message', schema: Message.schema },
      { name: 'User', schema: User.schema }
    ])
  ],
  controllers: [ChatController],
  providers: [ChatService, OpenRouterService, PaymentService],
  exports: [ChatService],
})
export class ChatModule {}
