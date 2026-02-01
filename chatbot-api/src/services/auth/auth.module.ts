import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { OtpModule } from '../otp/otp.module';
import User from '../../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: User.schema }]),
    OtpModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
