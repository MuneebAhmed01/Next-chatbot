import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, default: null })
  resetToken: string | null;

  @Prop({ type: Date, default: null })
  resetTokenExpiry: Date | null;

  @Prop({ type: String, default: null })
  otp: string | null;

  @Prop({ type: Date, default: null })
  otpExpiry: Date | null;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Number, default: 0 })
  credits: number;

  @Prop({ type: String, default: null })
  stripeCustomerId: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
