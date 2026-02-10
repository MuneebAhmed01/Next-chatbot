import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { UserModule } from './modules/user.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/next-chatbot'),
    AuthModule,
    ChatModule,
    PaymentModule,
    UserModule,
    MemoryModule,
  ],
})
export class AppModule { }
