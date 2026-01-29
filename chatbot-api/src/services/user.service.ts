import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import User from '../models/user.model';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<any>) { }

  
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  
  async initiateSignup(name: string, email: string, password: string) {
    try {
      
      const normalizedEmail = email?.toLowerCase().trim();

      const existingUser = await this.userModel.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new this.userModel({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        credits: 0,
        otp,
        otpExpiry,
        isVerified: false,
        createdAt: new Date(),
      });

      await newUser.save();

     
      console.log(`OTP for ${normalizedEmail}: ${otp} (expires: ${otpExpiry})`);

      return {
        message: 'OTP sent to your email',
        email: normalizedEmail,
        otp: otp
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify OTP and complete registration
  async verifyOTPAndSignup(email: string, otp: string) {
    // Normalize email
    const normalizedEmail = email?.toLowerCase().trim();
    const providedOTP = String(otp).trim();

    // Find the user
    const user = await this.userModel.findOne({ email: normalizedEmail });


    if (!user) {
      console.log('verifyOTPAndSignup - User not found for email:', normalizedEmail);
      console.log('Original email provided:', email);
      throw new BadRequestException('No pending registration found for this email');
    }

    // Debug logging - remove in production
    console.log('=== OTP DEBUG ===');
    console.log('User found:', JSON.stringify(user, null, 2));
    console.log('Stored OTP:', `"${user.otp}"`, 'Type:', typeof user.otp);
    console.log('Provided OTP:', `"${providedOTP}"`, 'Type:', typeof providedOTP);
    console.log('OTP Expiry:', user.otpExpiry);
    console.log('Current time:', new Date());
    console.log('Is expired:', user.otpExpiry ? new Date(user.otpExpiry).getTime() < Date.now() : 'no expiry');

  
    if (!user.otp) {
      throw new BadRequestException('No OTP found. Please request a new one');
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

  
    const storedOTP = String(user.otp).trim();
    console.log('Final comparison:', `"${storedOTP}"`, '===', `"${providedOTP}"`, ':', storedOTP === providedOTP);

    if (storedOTP !== providedOTP) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      $unset: {
        otp: 1,
        otpExpiry: 1,
      },
    });

    return {
      message: 'User created successfully',
      userId: user._id
    };
  }

  async resendOTP(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user || user.isVerified) {
      throw new BadRequestException('No pending registration found for this email');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userModel.findByIdAndUpdate(user._id, {
      otp,
      otpExpiry,
    });

    console.log(`New OTP for ${email}: ${otp}`); 

    // return {
    //   message: 'OTP resent to your email',
    //   otp: otp
    // };
  }

  
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

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('No account found with this email');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.userModel.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    return {
      message: 'Password reset token generated',
      resetToken: resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: {
        resetToken: 1,
        resetTokenExpiry: 1,
      },
    });

    return { message: 'Password reset successful' };
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async googleLogin(email: string, name: string, googleId: string) {
    const normalizedEmail = email?.toLowerCase().trim();

    let user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
   
      const randomPassword = randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new this.userModel({
        email: normalizedEmail,
        name,
        password: hashedPassword,
        isVerified: true, 
        credits: 0,
        createdAt: new Date(),
      });

      await user.save();
    } else {
    
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    return {
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits
      },
    };
  }
}
