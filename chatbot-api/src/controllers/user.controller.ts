import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";
import type { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "../zod-schemas/user.schema";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../zod-schemas/user.schema";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe";

@Controller("user")
export class UsersController {
  constructor(private readonly userService: UserService) { }

  @Get("login")
  showLoginPage() {
    return { message: "Welcome to the login page", status: "success" };
  }

  @Post("login")
  async login(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto) {
    return this.userService.login(loginDto.email, loginDto.password);
  }

  @Get("signup")
  showSignupPage() {
    return { message: "Welcome to the signup page", status: "success" };
  }

  @Post("signup")
  async signup(@Body(new ZodValidationPipe(signupSchema)) signupDto: SignupDto) {
    return this.userService.initiateSignup(signupDto.name, signupDto.email, signupDto.password);
  }

  @Post("forgot-password")
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) forgotPasswordDto: ForgotPasswordDto) {
    return this.userService.forgotPassword(forgotPasswordDto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post("verify-otp")
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return this.userService.verifyOTPAndSignup(body.email, body.otp);
  }

  @Post("resend-otp")
  async resendOTP(@Body() body: { email: string }) {
    return this.userService.resendOTP(body.email);
  }

  @Post("google-auth")
  async googleAuth(@Body() body: { email: string; name: string; googleId: string }) {
    return this.userService.googleLogin(body.email, body.name, body.googleId);
  }
}
