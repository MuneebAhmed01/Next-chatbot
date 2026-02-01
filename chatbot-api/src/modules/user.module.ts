import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { AuthModule } from '../auth/auth.module';
import User from '../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: User.schema }]),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
