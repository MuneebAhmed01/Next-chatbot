import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth/auth.service";
import { OtpService } from "../services/otp/otp.service";
import type { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "../zod-schemas/user.schema";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../zod-schemas/user.schema";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

@Controller("user")
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly otpService: OtpService
  ) {}

  @Get("login")
  showLoginPage() {
    return { message: "Welcome to the login page", status: "success" };
  }

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
    return this.otpService.verifyOTP(body.email, body.otp);
  }

  @Post("resend-otp")
  async resendOTP(@Body() body: { email: string }) {
    return this.otpService.resendOTP(body.email);
  }

  @Post("google-auth")
  async googleAuth(@Body() body: { email: string; name: string; googleId: string }) {
    return this.authService.googleLogin(body.email, body.name, body.googleId);
  }
}
