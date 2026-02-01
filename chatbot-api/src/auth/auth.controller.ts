import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginDto,
  SignupDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../zod-schemas/user.schema';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../zod-schemas/user.schema';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get("signup")
  showSignupPage() {
    return { message: "Welcome to the signup page", status: "success" };
  }

  @Post("signup")
  async signup(@Body(new ZodValidationPipe(signupSchema)) signupDto: SignupDto) {
    return this.authService.initiateSignup(signupDto.name, signupDto.email, signupDto.password);
  }

  @Post("forgot-password")
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.otp, resetPasswordDto.newPassword);
  }

  @Post("verify-otp")
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOTP(body.email, body.otp);
  }

  @Post("resend-otp")
  async resendOTP(@Body() body: { email: string }) {
    return this.authService.resendOTP(body.email);
  }
}
