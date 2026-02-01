import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { EmailService } from '../email/email.service';
import User from '../models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: User.schema }]),
  ],
  providers: [OtpService, EmailService],
  exports: [OtpService],
})
export class OtpModule {}
