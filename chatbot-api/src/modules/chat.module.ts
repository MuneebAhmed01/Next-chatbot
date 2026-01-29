import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';
import { PaymentModule } from './payment.module';

@Module({
  imports: [PaymentModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule { }
