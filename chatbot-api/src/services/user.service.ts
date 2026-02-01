import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<any>
  ) {}

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  // Get user by email
  async getUserByEmail(email: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  // Update user profile
  async updateUserProfile(userId: string, updateData: Partial<{ name: string; email: string }>) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }

  // Add credits to user
  async addCredits(userId: string, credits: number) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { credits } },
      { new: true }
    );

    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }

  // Deduct credits from user
  async deductCredits(userId: string, credits: number) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.credits < credits) {
      throw new BadRequestException('Insufficient credits');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { credits: -credits } },
      { new: true }
    );

    const { password, ...userWithoutPassword } = updatedUser.toObject();
    return userWithoutPassword;
  }

  // Delete user account
  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userModel.findByIdAndDelete(userId);
    return { message: 'User account deleted successfully' };
  }
}
