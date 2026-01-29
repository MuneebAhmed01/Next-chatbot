import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './modules/chat.module';
import { PaymentModule } from './modules/payment.module';
import { UserModule } from './modules/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/next-chatbot'),
    ChatModule,
    PaymentModule,
    UserModule,
  ],
})
export class AppModule { }
