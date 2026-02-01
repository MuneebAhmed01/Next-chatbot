import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { AuthModule } from '../services/auth/auth.module';
import { OtpModule } from '../services/otp/otp.module';
import User from '../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: User.schema }]),
    AuthModule,
    OtpModule,
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
