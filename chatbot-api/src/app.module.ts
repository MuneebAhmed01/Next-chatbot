import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers/user.controller';
import { UserModule } from './modules/user.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/chatbot-db'),
    UserModule,
  ],
  controllers: [UsersController],
  providers: [],
})
export class AppModule {}
