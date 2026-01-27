import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // Create new user
  async signup(name: string, email: string, password: string) {
    try {
      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new BadRequestException('Account already exists with this email');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new this.userModel({
        name,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      return { message: 'User created successfully', userId: newUser._id };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Account already exists with this email');
      }
      throw error;
    }
  }

  // Authenticate user
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  // Forgot password - generate reset token
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    const resetToken = randomBytes(32).toString('hex') ;
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    return {
      message: 'Password reset token generated',
      resetToken: resetToken,
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token ,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return { message: 'Password reset successful' };
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
